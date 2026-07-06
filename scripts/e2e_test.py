#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Suite E2E de Alteha — prueba el sistema completo contra el entorno local.

Cubre: salud, autenticación (4 roles), perfiles (lectura y edición), registro,
flujo completo de subasta (crear → publicar → oferta médico SOLO_MEDICO con
invitación a clínica → clínica acepta → oferta clínica SOLO_CLINICA con
invitación a médico → médico acepta bajando honorarios → paquete completo →
resumen de ofertas → adjudicación), paquetes (crear/editar/deshabilitar/
comprar/redimir), suscripciones (planes, límites por plan), disputas y reseñas.

Requisitos: backend en :8082, frontend en :3000, cuentas de prueba:
  - test.doctor@alteha.com / Test2026*        (DOCTOR, perfil 1)
  - clinica.loira@alteha.com / Loira2026*     (CLINIC, perfil 3)
  - test.seguro@alteha.com / Test2026*        (INSURANCE_COMPANY, aseguradora 1)

Uso:  python3 scripts/e2e_test.py
"""
import json
import sys
import time
import urllib.request
import urllib.error
import uuid

API = "http://localhost:8082/api"
FRONT = "http://localhost:3000"

ADMIN_USER = None
ADMIN_PASS = None

RESULTS = []  # (id, name, ok, detail)


def load_env_admin():
    global ADMIN_USER, ADMIN_PASS
    import os
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for name in ('.env.local', '.env'):
        try:
            with open(os.path.join(base, name)) as f:
                for line in f:
                    if line.startswith('NEXT_PUBLIC_ADMIN_USER=') and not ADMIN_USER:
                        ADMIN_USER = line.split('=', 1)[1].strip()
                    if line.startswith('NEXT_PUBLIC_ADMIN_PASS=') and not ADMIN_PASS:
                        ADMIN_PASS = line.split('=', 1)[1].strip()
        except FileNotFoundError:
            pass


def http(method, url, body=None, headers=None, form=None):
    """Devuelve (status, parsed_json_o_texto)."""
    h = dict(headers or {})
    data = None
    if form is not None:
        boundary = uuid.uuid4().hex
        parts = []
        for k, v in form.items():
            if isinstance(v, tuple):  # (filename, bytes, content_type)
                fn, content, ct = v
                parts.append(
                    (f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"; filename="{fn}"\r\n'
                     f'Content-Type: {ct}\r\n\r\n').encode() + content + b'\r\n')
            else:
                ct = 'application/json' if isinstance(v, (dict, list)) else 'text/plain'
                payload = json.dumps(v) if isinstance(v, (dict, list)) else str(v)
                parts.append(
                    (f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"'
                     + (f'; filename="blob"\r\nContent-Type: application/json' if ct == 'application/json' else '')
                     + f'\r\n\r\n{payload}\r\n').encode())
        data = b''.join(parts) + f'--{boundary}--\r\n'.encode()
        h['Content-Type'] = f'multipart/form-data; boundary={boundary}'
    elif body is not None:
        data = json.dumps(body).encode()
        h['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            text = r.read().decode()
            try:
                return r.status, json.loads(text)
            except Exception:
                return r.status, text
    except urllib.error.HTTPError as e:
        text = e.read().decode()
        try:
            return e.code, json.loads(text)
        except Exception:
            return e.code, text
    except Exception as e:
        return 0, str(e)


def is_rejected(st, r):
    """True si la operación fue rechazada (HTTP != 200 o código de error anidado)."""
    if st != 200:
        return True
    inner = unwrap(r)
    return isinstance(inner, dict) and inner.get('code') not in (None, '00')


def unwrap(r):
    """Devuelve el objeto útil: r.data si existe, o r si ya es el objeto."""
    if isinstance(r, dict):
        d = r.get('data')
        return d if isinstance(d, dict) else r
    return {}


def check(tid, name, ok, detail=""):
    RESULTS.append((tid, name, bool(ok), detail))
    mark = "\033[92mPASS\033[0m" if ok else "\033[91mFAIL\033[0m"
    print(f"  [{mark}] {tid} {name}" + (f"  — {detail}" if detail and not ok else ""))
    return ok


def section(title):
    print(f"\n\033[1m━━ {title} ━━\033[0m")


def main():
    load_env_admin()
    t0 = time.time()

    # ═══ A. SALUD DEL ENTORNO ═══
    section("A. Salud del entorno")
    st, _ = http('GET', f'{API}/specialties?page=0&size=1')
    # sin token esperamos 401/403 (vivo) — 0 significa caído
    check('A1', 'Backend 8082 responde', st != 0, f'status={st}')
    st, _ = http('GET', FRONT)
    check('A2', 'Frontend 3000 responde', st == 200, f'status={st}')

    # ═══ B. AUTENTICACIÓN ═══
    section("B. Autenticación")
    st, r = http('POST', f'{API}/authenticate', {'username': ADMIN_USER, 'password': ADMIN_PASS})
    admin = r.get('id_token') if isinstance(r, dict) else None
    check('B1', 'Token de administración', bool(admin), str(r)[:120])
    if not admin:
        return summary(t0)
    AH = {'Authorization': f'Bearer {admin}'}

    def actor_login(email, pwd, role):
        st, r = http('POST', f'{API}/actor-authenticate',
                     {'username': email, 'password': pwd, 'role': role}, AH)
        return (r or {}).get('id_token') if isinstance(r, dict) else None

    tok_doc = actor_login('test.doctor@alteha.com', 'Test2026*', 'DOCTOR')
    check('B2', 'Login médico de prueba', bool(tok_doc))
    tok_cli = actor_login('clinica.loira@alteha.com', 'Loira2026*', 'CLINIC')
    check('B3', 'Login clínica Loira', bool(tok_cli))
    tok_ins = actor_login('test.seguro@alteha.com', 'Test2026*', 'INSURANCE_COMPANY')
    check('B4', 'Login seguro de prueba', bool(tok_ins))
    tok_far = actor_login('test.farmacia@alteha.com', 'Test2026*', 'PHARMACY')
    check('B4b', 'Login casa de salud de prueba', bool(tok_far))
    st, r = http('POST', f'{API}/actor-authenticate',
                 {'username': 'test.doctor@alteha.com', 'password': 'MALA', 'role': 'DOCTOR'}, AH)
    check('B5', 'Contraseña incorrecta es rechazada', st != 200 or not (isinstance(r, dict) and r.get('id_token')))
    if not (tok_doc and tok_cli and tok_ins):
        return summary(t0)

    def H(tok):
        return {**AH, 'X-Alteha-Token': tok}

    # ═══ C. PERFILES ═══
    section("C. Perfiles (lectura y edición)")
    st, r = http('GET', f'{FRONT}/api/actor/profile?role=DOCTOR', headers={'X-Alteha-Token': tok_doc})
    doc_profile = (r or {}).get('data') if isinstance(r, dict) else {}
    check('C1', 'Perfil del médico carga', st == 200 and bool(doc_profile.get('id')))
    st, r = http('GET', f'{FRONT}/api/actor/profile?role=CLINIC', headers={'X-Alteha-Token': tok_cli})
    cli_profile = (r or {}).get('data') if isinstance(r, dict) else {}
    check('C2', 'Perfil de la clínica carga', st == 200 and cli_profile.get('name') == 'Centro Médico Loira')
    st, r = http('GET', f'{FRONT}/api/actor/profile?role=INSURANCE_COMPANY', headers={'X-Alteha-Token': tok_ins})
    ins_profile = (r or {}).get('data') if isinstance(r, dict) else {}
    check('C3', 'Perfil del seguro carga', st == 200 and bool(ins_profile))

    # Edición del perfil de la clínica (y reversión)
    orig_phone = cli_profile.get('phone') or '+58 212-406.32.11'
    st, r = http('PUT', f'{FRONT}/api/clinics/profile', headers={'X-Alteha-Token': tok_cli}, form={
        'clinic': {'name': cli_profile.get('name'), 'legalName': cli_profile.get('legalName'),
                   'email': cli_profile.get('email'), 'phone': '+58 212-999.99.99',
                   'website': cli_profile.get('website')}})
    ok_edit = st == 200 and isinstance(r, dict) and r.get('code') == '00'
    st2, r2 = http('GET', f'{FRONT}/api/actor/profile?role=CLINIC', headers={'X-Alteha-Token': tok_cli})
    persisted = ((r2 or {}).get('data') or {}).get('phone') == '+58 212-999.99.99'
    check('C4', 'Edición del perfil de clínica persiste', ok_edit and persisted)
    http('PUT', f'{FRONT}/api/clinics/profile', headers={'X-Alteha-Token': tok_cli}, form={
        'clinic': {'name': cli_profile.get('name'), 'legalName': cli_profile.get('legalName'),
                   'email': cli_profile.get('email'), 'phone': orig_phone,
                   'website': cli_profile.get('website')}})  # revertir

    # ═══ C2. PREPARACIÓN: PLAN ÉLITE (prueba compra + evita topes en el resto) ═══
    section("C2. Compra de plan (Élite vía Binance) para los actores de prueba")
    st, r = http('POST', f'{FRONT}/api/subscriptions/subscribe',
                 {'planCode': 'ELITE', 'method': 'BINANCE', 'reference': f'E2E-{uuid.uuid4().hex[:8]}'},
                 {'X-Alteha-Token': tok_doc})
    check('C5', 'Médico contrata Élite pagando por Binance',
          st == 200 and unwrap(r).get('planCode') == 'ELITE' or (isinstance(r, dict) and r.get('planCode') == 'ELITE'), str(r)[:150])
    st, r = http('POST', f'{FRONT}/api/subscriptions/subscribe',
                 {'planCode': 'ELITE', 'method': 'BINANCE', 'reference': f'E2E-{uuid.uuid4().hex[:8]}'},
                 {'X-Alteha-Token': tok_cli})
    check('C6', 'Clínica contrata Élite pagando por Binance',
          st == 200 and unwrap(r).get('planCode') == 'ELITE' or (isinstance(r, dict) and r.get('planCode') == 'ELITE'), str(r)[:150])
    # El pago sin referencia debe ser rechazado (validación del método)
    st, r = http('POST', f'{FRONT}/api/subscriptions/subscribe',
                 {'planCode': 'ELITE', 'method': 'BINANCE'}, {'X-Alteha-Token': tok_doc})
    check('C7', 'Pago Binance sin referencia es rechazado', unwrap(r).get('code') not in (None, '00') or st != 200)

    # ═══ D. REGISTRO ═══
    section("D. Registro de actores")
    mail = f'e2e.{uuid.uuid4().hex[:8]}@prueba-alteha.com'
    reg = {'email': mail, 'password': 'Registro2026*', 'phone': f'0412-{uuid.uuid4().hex[:7]}',
           'firstName': 'Prueba', 'lastName': 'E2E', 'identificationType': 'CEDULA',
           'identificationNumber': f'V-{uuid.uuid4().hex[:7]}',
           'medicalLicenseNumber': f'MPPS-{uuid.uuid4().hex[:6]}',
           'isIndependent': True, 'specialtyIds': [5], 'preferredClinicIds': []}
    st, r = http('POST', f'{API}/actor-register/doctor', headers=AH, form={'registration': reg})
    reg_ok = st in (200, 201) and isinstance(r, dict) and (r.get('code') in ('00', None) or r.get('id') or r.get('data'))
    check('D1', 'Registro de médico nuevo', reg_ok, str(r)[:150])

    # ═══ E. CATÁLOGOS ═══
    section("E. Catálogos")
    st, r = http('GET', f'{FRONT}/api/specialties?page=0&size=200&withProcedures=true')
    specs = r if isinstance(r, list) else []
    check('E1', 'Especialidades con intervenciones (10)', len(specs) >= 8, f'{len(specs)}')
    sp_id = specs[0]['id'] if specs else 5
    st, r = http('GET', f'{FRONT}/api/procedure-types?page=0&size=5&specialtyId={sp_id}')
    procs = r if isinstance(r, list) else (r or {}).get('content', [])
    check('E2', 'Tipos de intervención por especialidad', len(procs) > 0)
    proc_id = procs[0]['id'] if procs else 1
    st, r = http('GET', f'{FRONT}/api/subscriptions/bcv-rate', headers={'X-Alteha-Token': tok_doc})
    check('E3', 'Tasa BCV disponible', st == 200 and isinstance(r, dict) and r.get('rate') is not None)

    # ═══ F. FLUJO COMPLETO DE SUBASTA ═══
    section("F. Flujo de subasta (seguro → médico → clínica → duplas → adjudicación)")
    doc_id = doc_profile.get('id')      # médico de prueba (perfil 1)
    cli_id = cli_profile.get('id')      # Loira (3)
    stp, rp = http('GET', f'{API}/patients?page=0&size=1', headers=AH)
    patients = rp if isinstance(rp, list) else (rp or {}).get('content', [])
    patient_id = patients[0]['id'] if patients else 1500

    payload = {
        'title': 'E2E PRUEBA AUTOMATIZADA', 'description': 'Subasta creada por la suite E2E',
        'auctionType': 'REVERSE_AUCTION', 'status': 'DRAFT',
        'startDate': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
        'endDate': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(time.time() + 7 * 86400)),
        'maxBudget': 500, 'reservePrice': 0, 'urgencyLevel': 'MEDIUM',
        'patientAge': 40, 'patientGender': 'FEMENINO', 'medicalHistory': 'N/A',
        'preferredLocation': 'Caracas, Venezuela', 'requiresHospitalization': True,
        'estimatedDurationDays': 1, 'estimatedDuration': 0, 'anesthesiologist': False,
        'biopsyRequired': False, 'numberOfAssistants': 0, 'protocol': '', 'subSpecialty': '',
        'equipment': '', 'specialRequirements': '', 'termsAndConditions': 'E2E',
        'termsAndConditionsAccepted': True, 'showPrice': True, 'durationHours': 240,
        'autoExtendMinutes': 60, 'minBidsRequired': 1,
        'estimatedSurgeryDate': time.strftime('%Y-%m-%d', time.gmtime(time.time() + 20 * 86400)),
        'patient': {'id': patient_id}, 'specialty': {'id': sp_id}, 'currency': {'id': 1},
        'procedureType': {'id': proc_id}, 'clinicBudget': 200, 'doctorBudget': 300,
        'requiredSupplies': [], 'invitedDoctorIds': [doc_id], 'invitedClinicIds': [cli_id],
        'methodType': 'BS_BANK_TRANSFER', 'allowedPaymentMethods': ['BS_BANK_TRANSFER'],
    }
    st, r = http('POST', f'{FRONT}/api/auctions/publish', headers={'X-Alteha-Token': tok_ins},
                 form={'auction': payload})
    auction = (r.get('data') if isinstance(r, dict) and isinstance(r.get('data'), dict) else r) or {}
    auction_no = auction.get('auctionNumber')
    auction_id = auction.get('id')
    check('F1', 'Seguro crea la subasta', bool(auction_no), str(r)[:200])
    if not auction_no:
        return summary(t0)

    # DRAFT → PUBLISHED → ACTIVE
    status_now = auction.get('status')
    for target in ('PUBLISHED', 'ACTIVE'):
        if status_now == 'ACTIVE':
            break
        st, r = http('POST', f'{FRONT}/api/auctions/change-status',
                     {'auctionNumber': auction_no, 'newStatus': target, 'reason': 'E2E'},
                     {'X-Alteha-Token': tok_ins})
        data = (r.get('data') if isinstance(r, dict) and isinstance(r.get('data'), dict) else r) or {}
        status_now = data.get('status') or status_now
    check('F2', 'Subasta ACTIVA para ofertar', status_now == 'ACTIVE', f'status={status_now}')

    # F3: médico ve el detalle; F4: clínica ve el detalle
    st, r = http('GET', f'{FRONT}/api/auctions/doctor/details/{auction_no}?role=DOCTOR',
                 headers={'X-Alteha-Token': tok_doc})
    check('F3', 'Médico invitado ve el detalle', st == 200 and (r or {}).get('auctionNumber') == auction_no)
    st, r = http('GET', f'{FRONT}/api/auctions/doctor/details/{auction_no}?role=CLINIC',
                 headers={'X-Alteha-Token': tok_cli})
    check('F4', 'Clínica invitada ve el detalle', st == 200 and (r or {}).get('auctionNumber') == auction_no)

    # F5: oferta del médico SOLO_MEDICO invitando a Loira
    bid_doc = {'auction': {'id': auction_id}, 'bidType': 'DOCTOR_ONLY', 'modality': 'SOLO_MEDICO',
               'bidAmount': 250, 'notes': 'E2E médico solo', 'doctor': {'id': doc_id},
               'clinic': {'id': cli_id}, 'estimatedDurationDays': 1}
    st, r = http('POST', f'{FRONT}/api/bids/advanced', bid_doc, {'X-Alteha-Token': tok_doc})
    bid_doc_id = unwrap(r).get('id')
    check('F5', 'Médico oferta SOLO_MEDICO ($250) e invita a la clínica', bool(bid_doc_id), str(r)[:200])

    # F6: la clínica recibe la invitación y la acepta con $180
    st, r = http('GET', f'{FRONT}/api/clinic-invitations/mine', headers={'X-Alteha-Token': tok_cli})
    invs = r if isinstance(r, list) else []
    inv = next((i for i in invs if i.get('auctionNumber') == auction_no and i.get('status') == 'PENDING'), None)
    check('F6', 'Clínica recibe la invitación (dupla médico→clínica)', bool(inv))
    if inv:
        st, r = http('POST', f'{FRONT}/api/clinic-invitations/{inv["id"]}/respond',
                     {'accepted': True, 'clinicFee': 180}, {'X-Alteha-Token': tok_cli})
        ok = isinstance(r, dict) and (r.get('status') == 'ACCEPTED' or (r.get('data') or {}).get('status') == 'ACCEPTED' or r.get('id'))
        check('F7', 'Clínica acepta con $180 (total dupla $430)', ok, str(r)[:150])
    else:
        check('F7', 'Clínica acepta con $180', False, 'sin invitación')

    # F8: oferta de la clínica SOLO_CLINICA invitando al médico
    bid_cli = {'auction': {'id': auction_id}, 'bidType': 'CLINIC_ONLY', 'modality': 'SOLO_CLINICA',
               'bidAmount': 190, 'notes': 'E2E clínica sola', 'clinic': {'id': cli_id},
               'doctor': {'id': doc_id}, 'estimatedDurationDays': 1}
    st, r = http('POST', f'{FRONT}/api/bids/advanced', bid_cli, {'X-Alteha-Token': tok_cli})
    bid_cli_id = unwrap(r).get('id')
    check('F8', 'Clínica oferta SOLO_CLINICA ($190) e invita al médico', bool(bid_cli_id), str(r)[:200])

    # F9: el médico recibe la invitación y acepta BAJANDO honorarios ($280 < $300)
    st, r = http('GET', f'{FRONT}/api/doctor-invitations/mine', headers={'X-Alteha-Token': tok_doc})
    invs = r if isinstance(r, list) else []
    inv2 = next((i for i in invs if i.get('auctionNumber') == auction_no and i.get('status') == 'PENDING'), None)
    check('F9', 'Médico recibe la invitación (dupla clínica→médico)', bool(inv2))
    if inv2:
        st, r = http('POST', f'{FRONT}/api/doctor-invitations/{inv2["id"]}/respond',
                     {'accepted': True, 'doctorFee': 280}, {'X-Alteha-Token': tok_doc})
        data = (r or {}).get('data') if isinstance(r, dict) else {}
        total = (data or {}).get('total') or (r or {}).get('total')
        check('F10', 'Médico acepta bajando a $280 (total dupla $470)',
              str(total) in ('470', '470.0', '470.00'), f'total={total}')
        # F11: no puede superar el presupuesto médico
        st, r = http('POST', f'{FRONT}/api/doctor-invitations/{inv2["id"]}/respond',
                     {'accepted': True, 'doctorFee': 999}, {'X-Alteha-Token': tok_doc})
        nested = unwrap(r).get('code')
        rejected = st != 200 or (nested not in (None, '00'))
        check('F11', 'Responder dos veces / superar tope es rechazado', rejected, f'st={st} r={str(r)[:150]}')
    else:
        check('F10', 'Médico acepta bajando honorarios', False, 'sin invitación')
        check('F11', 'Validación de tope', False, 'sin invitación')

    # F12: paquete completo de la clínica ($450)
    bid_full = {'auction': {'id': auction_id}, 'bidType': 'BOTH', 'modality': 'PAQUETE_COMPLETO',
                'bidAmount': 450, 'notes': 'E2E paquete completo clínica', 'clinic': {'id': cli_id},
                'doctor': {'id': doc_id}, 'estimatedDurationDays': 1}
    st, r = http('POST', f'{FRONT}/api/bids/advanced', bid_full, {'X-Alteha-Token': tok_cli})
    bid_full_id = unwrap(r).get('id')
    check('F12', 'Clínica oferta PAQUETE_COMPLETO ($450) sin error de desglose', bool(bid_full_id), str(r)[:200])

    # F13: resumen de ofertas para el seguro
    st, r = http('GET', f'{FRONT}/api/clinic-invitations/auction/{auction_id}/bids-summary',
                 headers={'X-Alteha-Token': tok_ins})
    ok = isinstance(r, dict) and r.get('totalBids') == 3 and r.get('complete') == 3
    check('F13', 'Resumen: 3 ofertas, 3 completas (duplas aceptadas)', ok, str(r)[:150])

    # F14: duplas visibles para el seguro (ambos orígenes)
    st, r = http('GET', f'{FRONT}/api/clinic-invitations/auction/{auction_id}/duplas',
                 headers={'X-Alteha-Token': tok_ins})
    duplas = r if isinstance(r, list) else []
    origins = sorted({d.get('origin') for d in duplas})
    check('F14', 'Duplas de ambos orígenes visibles', origins == ['CLINIC_BID', 'DOCTOR_BID'], str(origins))

    # F15: adjudicar al paquete completo
    st, r = http('POST', f'{FRONT}/api/auctions/{auction_no}/award/{bid_full_id}',
                 headers={'X-Alteha-Token': tok_ins})
    ok = st == 200 and (unwrap(r).get('status') == 'AWARDED' or (isinstance(r, dict) and r.get('code') == '00'))
    check('F15', 'Seguro adjudica la subasta al paquete completo', ok, str(r)[:200])

    # ═══ G. PAQUETES ═══
    section("G. Paquetes comerciales")
    pkg = {'packageName': 'E2E Paquete Clínica', 'packageCode': f'E2E-{uuid.uuid4().hex[:6]}',
           'description': 'Creado por la suite E2E', 'basePrice': 99, 'discountedPrice': 79,
           'discountPercentage': 20,
           'validFrom': time.strftime('%Y-%m-%d', time.gmtime()),
           'validUntil': time.strftime('%Y-%m-%d', time.gmtime(time.time() + 90 * 86400)),
           'packageCategory': 'INTERVENCION',
           'specialty': {'id': sp_id}, 'procedureType': {'id': proc_id},
           'packageItems': [{'itemName': 'Intervención E2E', 'description': 'Item de prueba',
                             'quantity': 1, 'unitPrice': 99, 'itemType': 'PROCEDURE'}]}
    st, r = http('POST', f'{FRONT}/api/medical-packages/my/packages', pkg, {'X-Alteha-Token': tok_cli})
    pkg_id = unwrap(r).get('id')
    check('G1', 'Clínica crea paquete (Intervención)', bool(pkg_id), str(r)[:200])
    if pkg_id:
        st, r = http('PUT', f'{FRONT}/api/medical-packages/my/packages/{pkg_id}',
                     {'packageName': 'E2E Paquete Clínica (editado)', 'specialPrice': 75},
                     {'X-Alteha-Token': tok_cli})
        check('G2', 'Editar paquete publicado', st == 200)
        st, r = http('PUT', f'{FRONT}/api/medical-packages/my/packages/{pkg_id}/toggle',
                     headers={'X-Alteha-Token': tok_cli})
        check('G3', 'Deshabilitar paquete', st == 200 and unwrap(r).get('isActive') is False, str(r)[:100])
        st, r = http('PUT', f'{FRONT}/api/medical-packages/my/packages/{pkg_id}/toggle',
                     headers={'X-Alteha-Token': tok_cli})
        check('G4', 'Rehabilitar paquete', st == 200 and unwrap(r).get('isActive') is True, str(r)[:100])
        st, r = http('DELETE', f'{FRONT}/api/medical-packages/my/packages/{pkg_id}',
                     headers={'X-Alteha-Token': tok_cli})
        check('G5', 'Eliminar paquete sin compras', st == 200)
    st, r = http('GET', f'{FRONT}/api/medical-packages/all?page=0&size=5', headers={'X-Alteha-Token': tok_ins})
    lst = r if isinstance(r, list) else ((r or {}).get('data') or (r or {}).get('content') or [])
    check('G6', 'Marketplace de paquetes carga para el seguro', st == 200 and isinstance(lst, list))

    # ═══ H. SUSCRIPCIONES / PLANES ═══
    section("H. Suscripciones y límites de plan")
    st, r = http('GET', f'{FRONT}/api/subscriptions/plans', headers={'X-Alteha-Token': tok_doc})
    plans = r if isinstance(r, list) else []
    codes = {p.get('code') for p in plans}
    check('H1', 'Planes en BD (Explora/Impulso/Expansión/Élite)',
          {'EXPLORA', 'IMPULSO', 'EXPANSION', 'ELITE'} <= codes, str(codes))
    st, r = http('GET', f'{FRONT}/api/subscriptions/me', headers={'X-Alteha-Token': tok_cli})
    check('H2', 'Suscripción de la clínica (titular CLINIC)',
          st == 200 and isinstance(r, dict) and r.get('subjectType') == 'CLINIC', str(r)[:120])
    st, r = http('GET', f'{FRONT}/api/subscriptions/me', headers={'X-Alteha-Token': tok_doc})
    check('H3', 'Suscripción del médico (titular DOCTOR)',
          st == 200 and isinstance(r, dict) and r.get('subjectType') == 'DOCTOR')
    st, r = http('GET', f'{FRONT}/api/subscriptions/payments', headers={'X-Alteha-Token': tok_cli})
    check('H4', 'Historial de pagos del plan responde', st == 200 and isinstance(r, list))

    # ═══ I. DISPUTAS Y RESEÑAS ═══
    section("I. Disputas y reseñas")
    st, r = http('POST', f'{FRONT}/api/disputes', headers={'X-Alteha-Token': tok_cli}, form={
        'dispute': json.dumps({'auctionNumber': auction_no, 'type': 'OTRO', 'respondentRole': 'ALTEHA',
                               'description': 'Disputa de prueba E2E'})})
    disp = (r or {}).get('data') if isinstance(r, dict) else None
    check('I1', 'Clínica crea una disputa sobre la subasta', st == 200 and bool((disp or {}).get('id')), str(r)[:150])
    st, r = http('GET', f'{FRONT}/api/disputes/mine', headers={'X-Alteha-Token': tok_cli})
    lst = r if isinstance(r, list) else ((r or {}).get('data') or [])
    check('I2', 'Listado de disputas propias', st == 200 and isinstance(lst, list), f'st={st}')
    st, r = http('GET', f'{FRONT}/api/reviews?revieweeId.equals=1591&size=10')
    check('I3', 'Consulta de reseñas responde', st == 200)

    # ═══ K. CANCELACIONES Y RETIROS (matriz por rol y estado) ═══
    section("K. Cancelaciones y retiros")
    pay2 = dict(payload); pay2['title'] = 'E2E CANCELACIONES'
    st, r = http('POST', f'{FRONT}/api/auctions/publish', headers={'X-Alteha-Token': tok_ins}, form={'auction': pay2})
    a2 = (r.get('data') if isinstance(r, dict) and isinstance(r.get('data'), dict) else r) or {}
    a2_no, a2_id = a2.get('auctionNumber'), a2.get('id')
    st2 = a2.get('status')
    for target in ('PUBLISHED', 'ACTIVE'):
        if st2 == 'ACTIVE': break
        _, rr = http('POST', f'{FRONT}/api/auctions/change-status',
                     {'auctionNumber': a2_no, 'newStatus': target, 'reason': 'E2E'}, {'X-Alteha-Token': tok_ins})
        st2 = (unwrap(rr) or {}).get('status') or st2
    check('K1', 'Subasta de cancelaciones activa', st2 == 'ACTIVE' and bool(a2_no))

    st, r = http('POST', f'{FRONT}/api/bids/advanced',
                 {'auction': {'id': a2_id}, 'bidType': 'DOCTOR_ONLY', 'modality': 'SOLO_MEDICO',
                  'bidAmount': 240, 'notes': 'E2E retiro', 'doctor': {'id': doc_id},
                  'clinic': {'id': cli_id}, 'estimatedDurationDays': 1}, {'X-Alteha-Token': tok_doc})
    k_bid = unwrap(r).get('id')
    check('K2', 'Médico oferta con dupla (para retirarla)', bool(k_bid))

    st, r = http('POST', f'{FRONT}/api/cancellations/bid/{k_bid}', {}, {'X-Alteha-Token': tok_doc})
    check('K3', 'Retiro sin motivo es rechazado', is_rejected(st, r), str(r)[:120])

    st, r = http('POST', f'{FRONT}/api/cancellations/bid/{k_bid}',
                 {'reasonCode': 'ERROR_EN_MONTO'}, {'X-Alteha-Token': tok_doc})
    check('K4', 'Retiro con motivo funciona', st == 200 and unwrap(r).get('bidStatus') == 'WITHDRAWN', str(r)[:150])

    st, r = http('GET', f'{FRONT}/api/clinic-invitations/mine', headers={'X-Alteha-Token': tok_cli})
    inv_k = next((i for i in (r if isinstance(r, list) else []) if i.get('auctionNumber') == a2_no), None)
    check('K5', 'Dupla anulada al retirar la oferta', bool(inv_k) and inv_k.get('status') == 'REJECTED', str(inv_k)[:120])

    st, r = http('POST', f'{FRONT}/api/bids/advanced',
                 {'auction': {'id': a2_id}, 'bidType': 'BOTH', 'modality': 'PAQUETE_COMPLETO',
                  'bidAmount': 400, 'notes': 'E2E paquete', 'clinic': {'id': cli_id},
                  'doctor': {'id': doc_id}, 'estimatedDurationDays': 1}, {'X-Alteha-Token': tok_cli})
    k_bid2 = unwrap(r).get('id')
    st, r = http('POST', f'{FRONT}/api/cancellations/bid/{k_bid2}',
                 {'reasonCode': 'ERROR_EN_MONTO'}, {'X-Alteha-Token': tok_doc})
    check('K6', 'Nadie retira ofertas ajenas', is_rejected(st, r), str(r)[:120])

    st, r = http('POST', f'{FRONT}/api/cancellations/auction/{a2_no}', {}, {'X-Alteha-Token': tok_ins})
    check('K7', 'Cancelar con ofertas sin motivo es rechazado', is_rejected(st, r), str(r)[:120])

    st, r = http('POST', f'{FRONT}/api/cancellations/auction/{a2_no}',
                 {'reasonCode': 'PACIENTE_DESISTIO', 'reasonText': 'Prueba E2E'}, {'X-Alteha-Token': tok_ins})
    check('K8', 'Seguro cancela con motivo (cascada + notificaciones)',
          st == 200 and unwrap(r).get('status') == 'CANCELLED', str(r)[:150])

    st, r = http('POST', f'{FRONT}/api/cancellations/auction/{a2_no}',
                 {'reasonCode': 'OTRO', 'reasonText': 'repetida repetida'}, {'X-Alteha-Token': tok_ins})
    check('K9', 'Cancelar una subasta ya cancelada es rechazado', is_rejected(st, r), str(r)[:120])

    st, r = http('POST', f'{FRONT}/api/cancellations/auction/{auction_no}',
                 {'reasonCode': 'OTRO', 'reasonText': 'intento indebido'}, {'X-Alteha-Token': tok_ins})
    msg = str(unwrap(r).get('message', '') or (r or {}).get('message', ''))
    check('K10', 'Adjudicada: solo vía Disputas (bloqueada)', is_rejected(st, r) and 'isputa' in msg, f'st={st} msg={msg[:120]}')

    # ═══ L. CASAS DE SALUD: OFERTA POR INSUMOS + ADJUDICACIÓN DOBLE ═══
    section("L. Casas de salud (insumos)")
    pay3 = dict(payload); pay3['title'] = 'E2E CON INSUMOS'
    pay3['requiredSupplies'] = [
        {'itemName': 'Catéter doble J', 'quantity': 2, 'description': 'Insumo E2E'},
        {'itemName': 'Kit de sutura', 'quantity': 1, 'description': 'Insumo E2E'},
    ]
    st, r = http('POST', f'{FRONT}/api/auctions/publish', headers={'X-Alteha-Token': tok_ins}, form={'auction': pay3})
    a3 = (r.get('data') if isinstance(r, dict) and isinstance(r.get('data'), dict) else r) or {}
    a3_no, a3_id = a3.get('auctionNumber'), a3.get('id')
    st3 = a3.get('status')
    for target in ('PUBLISHED', 'ACTIVE'):
        if st3 == 'ACTIVE': break
        _, rr = http('POST', f'{FRONT}/api/auctions/change-status',
                     {'auctionNumber': a3_no, 'newStatus': target, 'reason': 'E2E'}, {'X-Alteha-Token': tok_ins})
        st3 = (unwrap(rr) or {}).get('status') or st3
    check('L1', 'Subasta con insumos activa', st3 == 'ACTIVE' and bool(a3_no))

    # La casa de salud la ve en su lista de abiertas
    st, r = http('GET', f'{FRONT}/api/pharmacy-auctions/open', headers={'X-Alteha-Token': tok_far})
    opens = r if isinstance(r, list) else []
    mine3 = next((x for x in opens if x.get('auctionNumber') == a3_no), None)
    check('L2', 'La casa de salud ve la subasta abierta con insumos', bool(mine3), f'{len(opens)} abiertas')

    # Detalle accesible con rol PHARMACY (ids de los insumos)
    st, r = http('GET', f'{FRONT}/api/auctions/doctor/details/{a3_no}?role=PHARMACY', headers={'X-Alteha-Token': tok_far})
    supplies = (r or {}).get('requiredSupplies') or []
    check('L3', 'Detalle accesible para la casa de salud (2 insumos)', st == 200 and len(supplies) == 2)

    # Oferta itemizada SOLO por los insumos
    items = [{'auctionSupply': {'id': sup['id']}, 'quantity': sup.get('quantity', 1), 'unitPrice': 40,
              'itemName': sup.get('itemName')} for sup in supplies]
    st, r = http('POST', f'{FRONT}/api/bids/advanced',
                 {'auction': {'id': a3_id}, 'bidType': 'PHARMACY', 'bidAmount': 0,
                  'notes': 'Material alemán certificado, despacho 48h antes de la intervención',
                  'bidItems': items}, {'X-Alteha-Token': tok_far})
    ph_bid = unwrap(r).get('id')
    ph_amount = unwrap(r).get('bidAmount')
    check('L4', 'Casa de salud oferta itemizada por los insumos', bool(ph_bid), str(r)[:180])

    # El médico también oferta (para la adjudicación doble)
    st, r = http('POST', f'{FRONT}/api/bids/advanced',
                 {'auction': {'id': a3_id}, 'bidType': 'DOCTOR_ONLY', 'modality': 'PAQUETE_COMPLETO',
                  'bidAmount': 420, 'notes': 'E2E médico', 'doctor': {'id': doc_id},
                  'clinic': {'id': cli_id}, 'estimatedDurationDays': 1}, {'X-Alteha-Token': tok_doc})
    med_bid = unwrap(r).get('id')
    check('L5', 'Médico oferta en la misma subasta', bool(med_bid))

    # El resumen separa insumos de ofertas médicas
    st, r = http('GET', f'{FRONT}/api/clinic-invitations/auction/{a3_id}/bids-summary',
                 headers={'X-Alteha-Token': tok_ins})
    check('L6', 'Resumen separa ofertas médicas (1) e insumos (1)',
          isinstance(r, dict) and r.get('totalBids') == 1 and r.get('pharmacyBids') == 1, str(r)[:140])

    # Con ofertas de insumos presentes, adjudicar sin elegir casa de salud debe rechazarse
    st, r = http('POST', f'{FRONT}/api/auctions/{a3_no}/award/{med_bid}',
                 headers={'X-Alteha-Token': tok_ins})
    msgL = str(unwrap(r).get('message', '') or (r or {}).get('message', ''))
    check('L6b', 'Adjudicar sin casa de salud es rechazado (selección obligatoria)',
          is_rejected(st, r) and 'casa' in msgL.lower(), f'st={st} msg={msgL[:120]}')

    # Adjudicación doble: médico + casa de salud
    st, r = http('POST', f'{FRONT}/api/auctions/{a3_no}/award/{med_bid}?pharmacyBidId={ph_bid}',
                 headers={'X-Alteha-Token': tok_ins})
    awarded = unwrap(r)
    ph_awarded = (awarded.get('awardedPharmacyBid') or {}).get('id') if isinstance(awarded.get('awardedPharmacyBid'), dict) else awarded.get('awardedPharmacyBidId')
    check('L7', 'Adjudicación doble (médico + casa de salud)',
          st == 200 and (awarded.get('status') == 'AWARDED') and (str(ph_awarded) == str(ph_bid) or ph_awarded is None),
          f"status={awarded.get('status')} phBid={ph_awarded}")

    # La comisión se calcula sobre médico+clínica+insumos y define el pago total del seguro
    st, r = http('GET', f'{FRONT}/api/commissions/auction/{a3_no}', headers={'X-Alteha-Token': tok_ins})
    comm = unwrap(r) if isinstance(r, dict) else {}
    base_ok = abs(float(comm.get('baseAmount') or 0) - (420 + float(ph_amount or 0))) < 0.01
    total_ok = abs(float(comm.get('total') or 0) - float(comm.get('baseAmount') or 0) * (1 + float(comm.get('rate') or 0) / 100)) < 0.05
    check('L7b', 'Comisión sobre médico+insumos y total del pago correcto',
          base_ok and total_ok, f"base={comm.get('baseAmount')} esperado={420 + float(ph_amount or 0)} total={comm.get('total')}")

    # Mis ofertas de la casa de salud registran la oferta
    st, r = http('GET', f'{FRONT}/api/pharmacy-auctions/my-bids', headers={'X-Alteha-Token': tok_far})
    mybids = r if isinstance(r, list) else []
    check('L8', 'Mis ofertas de la casa de salud', any(str(b.get('id')) == str(ph_bid) for b in mybids), f'{len(mybids)} ofertas')

    # ═══ M. GUÍA PAY: OPERACIÓN DE CAMBIO DE MONEDA ═══
    section("M. Guía Pay (cambio de moneda)")
    st, r = http('GET', f'{FRONT}/api/exchange/config', headers={'X-Alteha-Token': tok_doc})
    cfg_ok = isinstance(r, dict) and r.get('marginRate') is not None and float(r.get('bcvRate') or 0) > 0
    check('M1', 'Config de Guía Pay (tasa BCV + margen + monedas)', st == 200 and cfg_ok, str(r)[:140])
    bcv = float(r.get('bcvRate') or 0); marg = float(r.get('marginRate') or 0)

    # Cotización USD→BS coincide con BCV + margen
    st, r = http('POST', f'{FRONT}/api/exchange/quote', {'fromCurrency': 'USD', 'toCurrency': 'BS', 'amount': 100},
                 {'X-Alteha-Token': tok_doc})
    q = unwrap(r)
    expected = round(100 * bcv, 2) - round(100 * bcv * marg) / 100
    quote_ok = abs(float(q.get('amountTarget') or 0) - expected) < 0.05
    check('M2', 'Cotización USD→BS usa tasa BCV y margen', quote_ok, f"target={q.get('amountTarget')} esperado={expected}")

    # Sin método de cobro en la moneda destino, la solicitud se rechaza
    st, r = http('POST', f'{FRONT}/api/exchange/request',
                 {'role': 'DOCTOR', 'fromCurrency': 'USD', 'toCurrency': 'USDT', 'amount': 300},
                 {'X-Alteha-Token': tok_doc})
    msgM2 = str((r or {}).get('message', ''))
    check('M2b', 'Sin método de cobro en la moneda destino: rechazado (METODO_COBRO)',
          'METODO_COBRO' in msgM2, msgM2[:120])

    # La clínica (plan Élite, con Transferencia BS activa) sí puede solicitar USD→BS
    st, r = http('POST', f'{FRONT}/api/exchange/request',
                 {'role': 'CLINIC', 'fromCurrency': 'USD', 'toCurrency': 'BS', 'amount': 300,
                  'methodType': 'BS_BANK_TRANSFER', 'auctionNumber': a3_no},
                 {'X-Alteha-Token': tok_cli})
    op = unwrap(r)
    op_id = op.get('id')
    check('M3', 'Clínica Élite con método en Bs solicita cambio USD→BS', bool(op_id) and op.get('status') == 'REQUESTED', str(r)[:160])

    # La casa de salud sin plan Expansión/Élite es invitada a mejorar (PLAN_LIMIT)
    st, r = http('POST', f'{FRONT}/api/exchange/request',
                 {'role': 'PHARMACY', 'fromCurrency': 'USDT', 'toCurrency': 'BS', 'amount': 50},
                 {'X-Alteha-Token': tok_far})
    msgM = str((r or {}).get('message', ''))
    check('M4', 'Sin plan Expansión/Élite: invita a mejorar el plan (PLAN_LIMIT)', 'PLAN_LIMIT' in msgM, msgM[:120])

    # Administración: lista, programa y completa la operación
    tok_admE = actor_login('test.admin@alteha.com', 'Test2026*', 'ADMIN')
    st, r = http('GET', f'{FRONT}/api/exchange/all', headers={'X-Alteha-Token': tok_admE})
    ops = r if isinstance(r, list) else []
    check('M5', 'Módulo admin lista las operaciones', st == 200 and any(str(o.get('id')) == str(op_id) for o in ops), f'{len(ops)} operaciones')

    st, r = http('PUT', f'{FRONT}/api/exchange/{op_id}/status',
                 {'status': 'SCHEDULED', 'scheduledAt': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(time.time() + 86400))},
                 {'X-Alteha-Token': tok_admE})
    check('M6', 'Admin programa el pago en la moneda destino', unwrap(r).get('status') == 'SCHEDULED', str(r)[:120])

    st, r = http('PUT', f'{FRONT}/api/exchange/{op_id}/status', {'status': 'COMPLETED'}, {'X-Alteha-Token': tok_admE})
    check('M7', 'Admin completa la operación', unwrap(r).get('status') == 'COMPLETED', str(r)[:120])

    # Margen configurable: cambiar y restaurar
    st, r = http('PUT', f'{FRONT}/api/exchange/config', {'marginRate': 4.5}, {'X-Alteha-Token': tok_admE})
    changed = float((unwrap(r) or {}).get('marginRate') or 0) == 4.5
    st, r = http('PUT', f'{FRONT}/api/exchange/config', {'marginRate': marg}, {'X-Alteha-Token': tok_admE})
    restored = float((unwrap(r) or {}).get('marginRate') or -1) == marg
    check('M8', 'Margen de Alteha configurable (cambia y restaura)', changed and restored)

    # ═══ J. NOTIFICACIONES (fuentes) ═══
    section("J. Fuentes de notificaciones")
    st, r = http('GET', f'{FRONT}/api/clinic-invitations/mine', headers={'X-Alteha-Token': tok_cli})
    check('J1', 'Bandeja de invitaciones de la clínica', st == 200 and isinstance(r, list))
    st, r = http('GET', f'{FRONT}/api/doctor-invitations/mine', headers={'X-Alteha-Token': tok_doc})
    check('J2', 'Bandeja de invitaciones del médico', st == 200 and isinstance(r, list))

    summary(t0)


def summary(t0):
    total = len(RESULTS)
    passed = sum(1 for _, _, ok, _ in RESULTS if ok)
    failed = total - passed
    print("\n" + "═" * 60)
    print(f"\033[1mRESULTADO: {passed}/{total} pruebas OK, {failed} fallando  ({time.time()-t0:.1f}s)\033[0m")
    if failed:
        print("\nFallas:")
        for tid, name, ok, detail in RESULTS:
            if not ok:
                print(f"  ✗ {tid} {name} — {detail[:180]}")
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()

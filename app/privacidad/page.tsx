export const metadata = {
    title: 'Política de Privacidad — Alteha Médicos',
    description: 'Cómo Alteha recopila, usa y protege los datos de los médicos que usan la aplicación.',
};

// Política de privacidad pública (requisito de Google Play y de la app web).
export default function Privacidad() {
    const ACTUALIZADO = '1 de agosto de 2026';

    return (
        <main className="min-h-screen bg-white text-slate-700">
            <div className="max-w-3xl mx-auto px-6 py-14">
                <div className="flex items-center gap-3 mb-10">
                    <img src="/logoalteha.svg" alt="Alteha" className="h-11 w-auto" />
                    <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Sistema de Subastas</span>
                </div>

                <h1 className="text-4xl font-black text-slate-900">Política de Privacidad</h1>
                <p className="mt-2 text-sm font-semibold text-slate-400">
                    Aplicación <strong>Alteha Médicos</strong> · Última actualización: {ACTUALIZADO}
                </p>

                <div className="mt-10 space-y-8 text-[15px] leading-relaxed">
                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-2">Quiénes somos</h2>
                        <p>
                            AZAlteha (“Alteha”) opera una plataforma de subasta médica que conecta a médicos
                            especialistas con aseguradoras, clínicas y casas de salud. Esta política explica qué
                            datos recopila la aplicación <strong>Alteha Médicos</strong>, con qué fin y cómo los protegemos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-2">Datos que recopilamos</h2>
                        <ul className="space-y-2 list-disc pl-5">
                            <li>
                                <strong>Datos de identificación y profesionales:</strong> nombre, documento de identidad,
                                número de matrícula médica, especialidades, correo electrónico y teléfono. Se usan para
                                crear tu cuenta y verificar que eres un médico habilitado.
                            </li>
                            <li>
                                <strong>Documento de identidad y video de prueba de vida:</strong> imágenes que tomas con
                                la cámara durante la verificación de identidad. Se usan únicamente para comprobar que
                                eres quien dices ser y evitar suplantaciones.
                            </li>
                            <li>
                                <strong>Foto de perfil:</strong> la imagen que decides cargar, visible para las
                                aseguradoras y clínicas con las que interactúas.
                            </li>
                            <li>
                                <strong>Ubicación aproximada al iniciar sesión:</strong> si concedes el permiso, se
                                registra la ubicación del ingreso como medida de seguridad de la cuenta y para mostrar
                                subastas relevantes a tu zona. Puedes negarla y seguir usando la aplicación.
                            </li>
                            <li>
                                <strong>Identificador del dispositivo y token de notificaciones:</strong> para enviarte
                                avisos de subastas, aprobaciones y pagos, y para reconocer desde qué dispositivos entras.
                            </li>
                            <li>
                                <strong>Actividad en la plataforma:</strong> ofertas, adjudicaciones, mensajes con
                                clínicas y aseguradoras, y pagos asociados a tus intervenciones.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-2">Cómo usamos los datos</h2>
                        <p>
                            Usamos tus datos para operar el servicio: verificar tu identidad, mostrarte subastas de tu
                            especialidad, permitirte ofertar y comunicarte con clínicas y aseguradoras, gestionar pagos,
                            enviarte notificaciones y proteger tu cuenta. <strong>No vendemos tus datos</strong> ni los
                            usamos con fines publicitarios de terceros.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-2">Con quién se comparten</h2>
                        <ul className="space-y-2 list-disc pl-5">
                            <li>
                                <strong>Aseguradoras, clínicas y casas de salud</strong> de la red, cuando participas en
                                sus subastas: ven tu nombre, especialidad, foto de perfil y las condiciones de tu oferta.
                            </li>
                            <li>
                                <strong>Proveedores tecnológicos</strong> que hacen funcionar el servicio: Google Firebase
                                (notificaciones y mensajería), Amazon Web Services (alojamiento y archivos) y pasarelas de
                                pago. Procesan los datos siguiendo nuestras instrucciones.
                            </li>
                            <li>
                                <strong>Autoridades competentes</strong>, únicamente cuando la ley lo exija.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-2">Seguridad y conservación</h2>
                        <p>
                            La información viaja cifrada (HTTPS) y se almacena en servidores con acceso restringido. Los
                            documentos de verificación se conservan mientras tu cuenta esté activa y por el plazo que
                            exija la normativa aplicable; luego se eliminan o anonimizan.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-2">Tus derechos</h2>
                        <p>
                            Puedes acceder a tus datos, corregirlos, solicitar su eliminación o revocar permisos
                            (ubicación, cámara, notificaciones) desde los ajustes de tu teléfono o escribiéndonos.
                            Para <strong>eliminar tu cuenta y tus datos</strong>, escríbenos a{' '}
                            <a href="mailto:soporte@alteha.com" className="font-bold text-teal-600 underline">soporte@alteha.com</a>{' '}
                            y procesaremos la solicitud en un plazo máximo de 30 días.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-2">Menores de edad</h2>
                        <p>
                            La aplicación está dirigida exclusivamente a profesionales de la medicina mayores de edad.
                            No recopilamos datos de menores de forma intencional.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-2">Cambios y contacto</h2>
                        <p>
                            Si actualizamos esta política, publicaremos la nueva versión en esta página con su fecha.
                            Para cualquier consulta sobre privacidad escríbenos a{' '}
                            <a href="mailto:soporte@alteha.com" className="font-bold text-teal-600 underline">soporte@alteha.com</a>.
                        </p>
                    </section>
                </div>

                <footer className="mt-14 pt-6 border-t border-slate-100 text-xs font-semibold text-slate-400">
                    AZAlteha · Sistema de Subastas · {ACTUALIZADO}
                </footer>
            </div>
        </main>
    );
}

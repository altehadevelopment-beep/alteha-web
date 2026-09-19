// Integración con Google Drive para importar documentos del caso a una auditoría.
// Usa el Google Picker (selección de archivos privados, con consentimiento del usuario y
// permiso de solo lectura) + descarga de los bytes vía la API de Drive. No requiere
// backend: los archivos se suman al mismo flujo de subida de la auditoría.
//
// Credenciales (públicas del lado del cliente, restringidas por origen en Google Cloud):
//   NEXT_PUBLIC_GOOGLE_CLIENT_ID  → OAuth Client ID (tipo Web)
//   NEXT_PUBLIC_GOOGLE_API_KEY    → API Key
//   NEXT_PUBLIC_GOOGLE_APP_ID     → número de proyecto (App ID del Picker)

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
const APP_ID = process.env.NEXT_PUBLIC_GOOGLE_APP_ID || '';
// Scope no sensible: el app solo accede a los archivos que el usuario elige en el Picker.
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

/** ¿Están configuradas las credenciales de Google? (para mostrar u ocultar el botón). */
export const driveConfigurado = (): boolean => !!(CLIENT_ID && API_KEY);

function cargarScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof document === 'undefined') return reject(new Error('Sin DOM'));
        const existente = document.querySelector(`script[src="${src}"]`) as any;
        if (existente && existente.dataset.listo === '1') return resolve();
        const s = existente || document.createElement('script');
        s.src = src; s.async = true; s.defer = true;
        s.addEventListener('load', () => { s.dataset.listo = '1'; resolve(); });
        s.addEventListener('error', () => reject(new Error('No se pudo cargar ' + src)));
        if (!existente) document.body.appendChild(s);
        else if (existente.dataset.listo === '1') resolve();
    });
}

async function cargarLibs(): Promise<void> {
    await cargarScript('https://apis.google.com/js/api.js');
    await cargarScript('https://accounts.google.com/gsi/client');
    await new Promise<void>((resolve) => (window as any).gapi.load('picker', () => resolve()));
}

function pedirToken(): Promise<string> {
    return new Promise((resolve, reject) => {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPE,
            callback: (resp: any) =>
                resp && resp.access_token ? resolve(resp.access_token) : reject(new Error('No se obtuvo autorización')),
            error_callback: (err: any) => reject(new Error(err?.message || 'Autorización cancelada')),
        });
        tokenClient.requestAccessToken({ prompt: '' });
    });
}

function abrirPicker(token: string): Promise<any[]> {
    return new Promise((resolve) => {
        const g = (window as any).google;
        const view = new g.picker.DocsView(g.picker.ViewId.DOCS)
            .setIncludeFolders(true)
            .setSelectFolderEnabled(false)
            .setMimeTypes('application/pdf,image/png,image/jpeg,image/jpg,image/webp,application/vnd.google-apps.document');
        const builder = new g.picker.PickerBuilder()
            .enableFeature(g.picker.Feature.MULTISELECT_ENABLED)
            .setOAuthToken(token)
            .setDeveloperKey(API_KEY)
            .addView(view)
            .setCallback((data: any) => {
                const action = data[g.picker.Response.ACTION];
                if (action === g.picker.Action.PICKED) resolve(data[g.picker.Response.DOCUMENTS] || []);
                else if (action === g.picker.Action.CANCEL) resolve([]);
            });
        if (APP_ID) builder.setAppId(APP_ID);
        builder.build().setVisible(true);
    });
}

async function descargar(doc: any, token: string): Promise<File> {
    const g = (window as any).google;
    const id = doc[g.picker.Document.ID];
    const nombre = doc[g.picker.Document.NAME] || 'documento';
    const mime = doc[g.picker.Document.MIME_TYPE] || '';
    const esNativo = mime.startsWith('application/vnd.google-apps');
    const url = esNativo
        ? `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=application/pdf`
        : `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) throw new Error(`No se pudo descargar "${nombre}" (${resp.status})`);
    const blob = await resp.blob();
    const fname = esNativo && !/\.pdf$/i.test(nombre) ? `${nombre}.pdf` : nombre;
    return new File([blob], fname, { type: blob.type || (esNativo ? 'application/pdf' : mime) });
}

/** Abre el selector de Google Drive y devuelve los archivos elegidos ya descargados. */
export async function importarDeDrive(): Promise<File[]> {
    if (!driveConfigurado()) throw new Error('Google Drive no está configurado en esta plataforma.');
    await cargarLibs();
    const token = await pedirToken();
    const docs = await abrirPicker(token);
    const files: File[] = [];
    for (const d of docs) {
        files.push(await descargar(d, token));
    }
    return files;
}

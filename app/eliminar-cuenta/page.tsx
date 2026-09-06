export const metadata = {
    title: 'Eliminar mi cuenta y datos — Alteha',
    description: 'Cómo solicitar la eliminación de tu cuenta de Alteha y de los datos asociados.',
};

// Página pública requerida por Google Play: el usuario puede solicitar aquí la
// eliminación de su cuenta y datos sin necesidad de tener la app instalada.
export default function EliminarCuentaPage() {
    const correo = 'soporte@alteha.com';
    const asunto = encodeURIComponent('Solicitud de eliminación de cuenta - Alteha');
    const cuerpo = encodeURIComponent(
        'Hola, solicito la eliminación de mi cuenta de Alteha y de los datos asociados.\n\n' +
        'Correo de mi cuenta: \nNombre completo: \nCédula/Identificación: \n',
    );

    return (
        <main style={{ minHeight: '100vh', background: '#F8FAFC', color: '#1E293B', fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                    <img src="/logoalteha.svg" alt="Alteha" style={{ height: 40 }} />
                    <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.5px', color: '#0F172A' }}>azALTEHA</span>
                </div>

                <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.5px', margin: 0, color: '#0F172A' }}>
                    Eliminar mi cuenta y mis datos
                </h1>
                <p style={{ fontSize: 17, lineHeight: 1.6, color: '#475569', marginTop: 12 }}>
                    En Alteha respetamos tu derecho a eliminar tu cuenta y la información personal asociada a ella.
                    Puedes solicitar la eliminación en cualquier momento siguiendo los pasos de abajo.
                </p>

                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 40 }}>Cómo solicitar la eliminación</h2>
                <ol style={{ fontSize: 16, lineHeight: 1.7, color: '#334155', paddingLeft: 22, marginTop: 12 }}>
                    <li>Escríbenos a <strong>{correo}</strong> desde el correo con el que te registraste, con el asunto «Solicitud de eliminación de cuenta».</li>
                    <li>Indícanos tu nombre completo y tu número de cédula/identificación para verificar tu identidad.</li>
                    <li>Confirmaremos tu identidad y procesaremos la eliminación.</li>
                </ol>

                <div style={{ margin: '24px 0' }}>
                    <a href={`mailto:${correo}?subject=${asunto}&body=${cuerpo}`}
                        style={{ display: 'inline-block', background: '#0F172A', color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px 28px', borderRadius: 14, textDecoration: 'none' }}>
                        Solicitar eliminación por correo
                    </a>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 40 }}>Qué datos se eliminan</h2>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: '#334155', marginTop: 8 }}>
                    Al procesar tu solicitud se eliminan de forma permanente los datos personales asociados a tu cuenta:
                </p>
                <ul style={{ fontSize: 16, lineHeight: 1.7, color: '#334155', paddingLeft: 22 }}>
                    <li>Datos de perfil: nombre, apellido, cédula, correo y teléfono.</li>
                    <li>Documentos de verificación de identidad y las imágenes de prueba de vida.</li>
                    <li>Historial de actividad en la plataforma (subastas, ofertas, conversaciones y notificaciones).</li>
                    <li>Métodos de cobro y preferencias de la cuenta.</li>
                </ul>

                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 32 }}>Qué datos podemos conservar</h2>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: '#334155', marginTop: 8 }}>
                    Por obligaciones legales, contables y de prevención de fraude, podemos conservar cierta información
                    (por ejemplo, registros de transacciones y facturación) durante el período que exige la ley aplicable,
                    tras lo cual se elimina de forma segura. Estos datos no se usan para ningún otro fin.
                </p>

                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 32 }}>Plazo</h2>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: '#334155', marginTop: 8 }}>
                    Tu solicitud se procesa en un plazo máximo de <strong>30 días</strong>. Te confirmaremos por correo
                    cuando la eliminación se haya completado.
                </p>

                <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 48, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                    ¿Preguntas sobre tus datos? Escríbenos a {correo}. · azALTEHA — Sistema de Subastas Médicas
                </p>
            </div>
        </main>
    );
}

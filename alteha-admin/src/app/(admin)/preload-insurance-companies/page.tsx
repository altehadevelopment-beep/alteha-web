import ExcelImportExport, { FieldDef } from '@/components/ui/ExcelImportExport';
import EntityCrud from '@/components/ui/EntityCrud';

const INSURANCE_FIELDS: FieldDef[] = [
    { key: 'name',           label: 'Nombre Aseguradora',   example: 'Seguros Caracas',     required: true },
    { key: 'rif',            label: 'RIF',                   example: 'J-30000000-0',        required: true },
    { key: 'email',          label: 'Correo Corporativo',    example: 'info@seguros.com',    required: true },
    { key: 'phone',          label: 'Teléfono Principal',    example: '0212-7771234',        required: true },
    { key: 'address',        label: 'Dirección',             example: 'Torre Seguros, Piso 3',required: true },
    { key: 'cityId',         label: 'Ciudad',                example: '1',                   required: true },
    { key: 'stateId',        label: 'Estado',                example: '1',                   required: false },
    { key: 'countryId',      label: 'País',                  example: '1',                   required: false },
    { key: 'contactName',    label: 'Contacto Comercial',    example: 'Ana Martínez',        required: false },
    { key: 'contactEmail',   label: 'Email de Contacto',     example: 'amartinez@mail.com',  required: false },
    { key: 'contactPhone',   label: 'Tel. de Contacto',      example: '0412-5550000',        required: false },
    { key: 'policyTypes',    label: 'Tipos de Póliza',       example: 'Salud,Dental,Visión', required: false },
    { key: 'website',        label: 'Sitio Web',             example: 'https://seguros.com', required: false },
];

export default function PreloadInsurancePage() {
    return (
        <div className="space-y-12">
            <ExcelImportExport
                title="Precarga Masiva de Aseguradoras"
                entityPath="preload-insurance-companies"
                fields={INSURANCE_FIELDS}
                description="Descarga la plantilla, rellena los datos de las compañías aseguradoras y sus contactos, y sube el archivo para registrarlas en el sistema."
            />

            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/40 border border-slate-100/50">
                <header className="mb-8">
                    <h2 className="text-2xl font-black font-outfit text-slate-900 uppercase">Gestión Manual de Aseguradoras</h2>
                    <p className="text-slate-500 font-medium">Visualiza, edita o elimina compañías aseguradoras registradas</p>
                </header>
                <EntityCrud 
                    entityName="insurance-companies" 
                    schemaKeys={INSURANCE_FIELDS.map(f => f.key)}
                />
            </div>
        </div>
    );
}

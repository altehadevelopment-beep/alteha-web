import ExcelImportExport, { FieldDef } from '@/components/ui/ExcelImportExport';
import EntityCrud from '@/components/ui/EntityCrud';

const CLINIC_FIELDS: FieldDef[] = [
    { key: 'name',           label: 'Nombre de Clínica',  example: 'Clínica Santa Fe',  required: true },
    { key: 'rif',            label: 'RIF',                example: 'J-12345678-9',       required: true },
    { key: 'email',          label: 'Correo',             example: 'info@clinica.com',   required: true },
    { key: 'phone',          label: 'Teléfono',           example: '0212-5551234',        required: true },
    { key: 'address',        label: 'Dirección',          example: 'Av. Principal #10',  required: true },
    { key: 'cityId',         label: 'Ciudad',             example: '1',                  required: true },
    { key: 'stateId',        label: 'Estado',             example: '1',                  required: false },
    { key: 'countryId',      label: 'País',               example: '1',                  required: false },
    { key: 'managerName',    label: 'Gerente / Director', example: 'María González',     required: false },
    { key: 'managerEmail',   label: 'Email del Gerente',  example: 'mgonzalez@mail.com', required: false },
    { key: 'managerPhone',   label: 'Tel. del Gerente',   example: '0414-9876543',       required: false },
    { key: 'specialties',    label: 'Especialidades',     example: 'Cardiología,Pediatría',required: false },
    { key: 'beds',           label: 'N° de Camas',        example: '50',                 required: false },
];

export default function PreloadClinicsPage() {
    return (
        <div className="space-y-12">
            <ExcelImportExport
                title="Precarga Masiva de Clínicas"
                entityPath="preload-clinics"
                fields={CLINIC_FIELDS}
                description="Descarga la plantilla, rellena los datos de las clínicas e instituciones de salud y sube el archivo para registrarlas en el sistema."
            />

            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/40 border border-slate-100/50">
                <header className="mb-8">
                    <h2 className="text-2xl font-black font-outfit text-slate-900 uppercase">Gestión Manual de Clínicas</h2>
                    <p className="text-slate-500 font-medium">Visualiza, edita o elimina clínicas registradas en el sistema</p>
                </header>
                <EntityCrud 
                    entityName="clinics" 
                    schemaKeys={CLINIC_FIELDS.map(f => f.key)} 
                />
            </div>
        </div>
    );
}

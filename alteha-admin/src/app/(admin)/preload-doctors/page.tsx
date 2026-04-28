import ExcelImportExport, { FieldDef } from '@/components/ui/ExcelImportExport';
import EntityCrud from '@/components/ui/EntityCrud';

const DOCTOR_FIELDS: FieldDef[] = [
    { key: 'firstName',      label: 'Nombre',           example: 'Carlos',         required: true },
    { key: 'lastName',       label: 'Apellido',          example: 'Rodríguez',      required: true },
    { key: 'email',          label: 'Correo',            example: 'carlos@mail.com',required: true },
    { key: 'phone',          label: 'Teléfono',          example: '0414-1234567',   required: true },
    { key: 'documentType',   label: 'Tipo Documento',    example: 'V',              required: true },
    { key: 'documentNumber', label: 'Número Documento',  example: '12345678',       required: true },
    { key: 'licenseNumber',  label: 'N° Licencia Médica',example: 'LM-00123',      required: true },
    { key: 'specialtyId',    label: 'Especialidad',      example: '1',              required: true },
    { key: 'gender',         label: 'Género',            example: 'M',              required: false },
    { key: 'birthDate',      label: 'Fecha Nacimiento',  example: '1980-05-15',     required: false },
    { key: 'cityId',         label: 'Ciudad',            example: '1',              required: false },
    { key: 'countryId',      label: 'País',              example: '1',              required: false },
    { key: 'yearsExp',       label: 'Años de Experiencia',example: '10',            required: false },
];

export default function PreloadDoctorsPage() {
    return (
        <div className="space-y-12">
            <ExcelImportExport
                title="Precarga Masiva de Médicos"
                entityPath="preload-doctors"
                fields={DOCTOR_FIELDS}
                description="Descarga la plantilla, rellena los datos de los médicos y sube el archivo para registrarlos en el sistema de forma masiva."
            />

            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/40 border border-slate-100/50">
                <header className="mb-8">
                    <h2 className="text-2xl font-black font-outfit text-slate-900 uppercase">Gestión Manual de Médicos</h2>
                    <p className="text-slate-500 font-medium">Visualiza, edita o elimina médicos registrados en el sistema</p>
                </header>
                <EntityCrud 
                    entityName="doctors" 
                    schemaKeys={DOCTOR_FIELDS.map(f => f.key)}
                />
            </div>
        </div>
    );
}

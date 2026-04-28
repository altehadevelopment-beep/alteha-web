import ExcelImportExport, { FieldDef } from '@/components/ui/ExcelImportExport';
import EntityCrud from '@/components/ui/EntityCrud';

const PHARMACY_FIELDS: FieldDef[] = [
    { key: 'name',           label: 'Nombre Farmacia',      example: 'Farmatodo Sambil',    required: true },
    { key: 'rif',            label: 'RIF',                  example: 'J-44444444-4',         required: true },
    { key: 'email',          label: 'Correo',               example: 'sucursal1@farma.com',  required: true },
    { key: 'phone',          label: 'Teléfono',             example: '0212-9990000',         required: true },
    { key: 'address',        label: 'Dirección',            example: 'C.C. Sambil, Nivel Feria',required: true },
    { key: 'cityId',         label: 'Ciudad',               example: '1',                   required: true },
    { key: 'managerName',    label: 'Regente / Encargado',  example: 'Juan Pérez',          required: false },
    { key: 'licenseNumber',  label: 'N° Permiso Sanitario', example: 'FPS-55667',           required: false },
];

export default function PreloadPharmaciesPage() {
    return (
        <div className="space-y-12">
            <ExcelImportExport
                title="Precarga Masiva de Farmacias"
                entityPath="preload-pharmacies"
                fields={PHARMACY_FIELDS}
                description="Descarga la plantilla, rellena los datos de las farmacias y sucursales, y sube el archivo para integrarlas a la red Alteha."
            />

            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/40 border border-slate-100/50">
                <header className="mb-8">
                    <h2 className="text-2xl font-black font-outfit text-slate-900 uppercase">Gestión Manual de Farmacias</h2>
                    <p className="text-slate-500 font-medium">Visualiza o edita farmacias registradas en el ecosistema</p>
                </header>
                <EntityCrud 
                    entityName="pharmacies" 
                    schemaKeys={PHARMACY_FIELDS.map(f => f.key)}
                />
            </div>
        </div>
    );
}

import Image from 'next/image';

interface LoaderProps {
    className?: string;
    size?: number;
}

export function Loader({ className = '', size = 100 }: LoaderProps) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="relative" style={{ width: size, height: size }}>
                <Image
                    src="/loader.gif"
                    alt="Loading..."
                    fill
                    className="object-contain"
                    priority
                />
            </div>
        </div>
    );
}

export function FullPageLoader() {
    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Loader size={150} />
        </div>
    );
}

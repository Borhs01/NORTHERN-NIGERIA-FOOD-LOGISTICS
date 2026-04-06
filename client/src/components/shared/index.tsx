import { Loader2 } from 'lucide-react';
import AddressInput from './AddressInput';
import AddressInputDark from './AddressInputDark';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  fullPage?: boolean;
}

export const Spinner = ({ size = 'md', color = 'text-orange-500', fullPage = false }: Props) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/70 z-50">
        <Loader2 className={`${sizes[size]} ${color} animate-spin`} />
      </div>
    );
  }
  return <Loader2 className={`${sizes[size]} ${color} animate-spin`} />;
};

export { AddressInput, AddressInputDark };
export { default as ProfileDropdown } from './ProfileDropdown';

export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
    <div className="h-44 bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-1/4" />
    </div>
  </div>
);

export const Badge = ({ label, className = '' }: { label: string; className?: string }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>{label}</span>
);

export const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="text-center mb-12">
    <h2 className="heading-font text-3xl md:text-4xl font-bold text-gray-900 mb-3">{title}</h2>
    {subtitle && <p className="text-gray-500 text-lg max-w-xl mx-auto">{subtitle}</p>}
  </div>
);

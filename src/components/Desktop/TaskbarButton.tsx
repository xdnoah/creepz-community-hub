import { Button95 } from '../ui/Button95';

interface TaskbarButtonProps {
  title: string;
  onClick: () => void;
  active?: boolean;
}

export function TaskbarButton({ title, onClick, active }: TaskbarButtonProps) {
  return (
    <Button95
      onClick={onClick}
      className={`px-3 py-1 text-sm max-w-[150px] truncate ${
        active ? 'border-t-gray-800 border-l-gray-800 border-b-white border-r-white' : ''
      }`}
    >
      {title}
    </Button95>
  );
}

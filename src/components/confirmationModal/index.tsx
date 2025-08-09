import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

export interface ConfirmationModalProps {
  isShown: boolean;
  toggle: (open?: boolean) => void;
  title: string;
  description?: ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  cancelVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  isLoading?: boolean;
  showCloseIcon?: boolean;
}

export const ConfirmationModal = ({
  isShown,
  toggle,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Yes',
  cancelText = 'No',
  confirmVariant = 'default',
  cancelVariant = 'outline',
  isLoading = false,
}: ConfirmationModalProps) => {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    if (!isLoading) {
      toggle(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    toggle(false);
  };

  return (
    <Dialog open={isShown} onOpenChange={toggle}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant={cancelVariant}
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
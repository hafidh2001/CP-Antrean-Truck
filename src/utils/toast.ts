interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'bottom-right' | 'center' | 'bottom-center';
}

export function showToast(
  message: string, 
  type: 'success' | 'error' = 'success', 
  options: ToastOptions = {}
) {
  const { duration = 3000, position = 'bottom-center' } = options;
  
  const toast = document.createElement('div');
  
  // Base styles
  toast.className = `fixed z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 transform`;
  
  // Position styles
  if (position === 'center') {
    toast.className += ` top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[280px] max-w-[320px] text-center`;
  } else if (position === 'top-right') {
    toast.className += ` top-4 right-4 max-w-sm`;
  } else if (position === 'bottom-right') {
    toast.className += ` bottom-4 right-4 max-w-[280px]`;
  } else if (position === 'bottom-center') {
    toast.className += ` bottom-4 left-1/2 -translate-x-1/2 min-w-[280px] max-w-[320px] text-center`;
  }
  
  // Color styles
  if (type === 'success') {
    toast.className += ` bg-green-500`;
  } else {
    toast.className += ` bg-red-500`;
  }
  
  toast.textContent = message;
  
  // Initial state for animation
  toast.style.opacity = '0';
  
  if (position === 'center') {
    toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
  } else if (position === 'bottom-right' || position === 'bottom-center') {
    toast.style.transform = position === 'bottom-center' ? 'translate(-50%, 100%)' : 'translateY(100%)';
  } else {
    toast.style.transform = 'translateY(-100%)';
  }
  
  document.body.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    if (position === 'center') {
      toast.style.transform = 'translate(-50%, -50%) scale(1)';
    } else if (position === 'bottom-center') {
      toast.style.transform = 'translate(-50%, 0)';
    } else {
      toast.style.transform = 'translateY(0)';
    }
  });
  
  // Remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    if (position === 'center') {
      toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
    } else if (position === 'bottom-right') {
      toast.style.transform = 'translateY(100%)';
    } else if (position === 'bottom-center') {
      toast.style.transform = 'translate(-50%, 100%)';
    } else {
      toast.style.transform = 'translateY(-100%)';
    }
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, duration);
}
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';
import type { IProductionCodeCard } from '@/types/productionCode';

interface ProductionCodeCardProps {
  code: IProductionCodeCard;
  onClick: (code: IProductionCodeCard) => void;
}

export function ProductionCodeCard({ code, onClick }: ProductionCodeCardProps) {
  const progressText = `${code.completed_entries}/${code.total_entries} entri kode`;
  const isFullyCompleted = code.completed_entries === code.total_entries;

  return (
    <Card 
      className="cursor-pointer hover:bg-blue-50 transition-all duration-200 border-gray-300 shadow-sm hover:shadow-md"
      onClick={() => onClick(code)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Goods Code (Production Code) - Main Info */}
          <div className="text-lg font-bold text-gray-900">
            {code.goods_code}
          </div>
          
          {/* DO Number */}
          <div className="text-sm text-gray-700">
            {code.do_no}
          </div>
          
          {/* Quantity Info */}
          <div className="text-sm text-gray-600">
            {code.quantities.map((q, index) => (
              <span key={index}>
                {q.quantity} {q.uom}
                {index < code.quantities.length - 1 && ', '}
              </span>
            ))}
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 pt-2">
            {isFullyCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400" />
            )}
            <span className={`text-sm font-medium ${
              isFullyCompleted ? 'text-green-600' : 'text-gray-600'
            }`}>
              {progressText}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
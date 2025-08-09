import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IStorageUnit, IFontFamily, ITextStyling } from '@/types/warehouseDetail';
import { StorageTypeEnum } from '@/types';
import { Package, RotateCw, Palette, Type } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StorageUnitDialogProps {
  unit: IStorageUnit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updates: Partial<IStorageUnit>) => void;
  onDelete: () => void;
}

const fontFamilies: IFontFamily[] = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'system-ui', label: 'System UI' },
];

export const StorageUnitDialog = ({ unit, open, onOpenChange, onUpdate, onDelete }: StorageUnitDialogProps) => {
  const [unitName, setUnitName] = useState(unit?.label || '');
  const [typeStorage, setTypeStorage] = useState(unit?.type_storage || StorageTypeEnum.WAREHOUSE);
  const [fontSize, setFontSize] = useState(unit?.text_styling?.font_size || 16);
  const [fontFamily, setFontFamily] = useState(unit?.text_styling?.font_family || 'Arial, sans-serif');
  const [rotation, setRotation] = useState(unit?.text_styling?.rotation || 0);
  const [textColor, setTextColor] = useState(unit?.text_styling?.text_color || '#000000');

  // Update local state when unit changes
  useEffect(() => {
    if (unit) {
      setUnitName(unit.label);
      setTypeStorage(unit.type_storage || StorageTypeEnum.WAREHOUSE);
      setFontSize(unit.text_styling?.font_size || 16);
      setFontFamily(unit.text_styling?.font_family || 'Arial, sans-serif');
      setRotation(unit.text_styling?.rotation || 0);
      setTextColor(unit.text_styling?.text_color || '#000000');
    }
  }, [unit]);

  if (!unit) return null;

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    onUpdate({ 
      text_styling: { 
        font_size: fontSize,
        font_family: fontFamily,
        rotation: newRotation,
        text_color: textColor
      } 
    });
  };

  const handleTypeChange = (newType: StorageTypeEnum) => {
    setTypeStorage(newType);
    onUpdate({ type_storage: newType });
  };

  const handleTextStyleUpdate = (field: keyof ITextStyling, value: string | number) => {
    const updates = {
      text_styling: {
        font_size: fontSize,
        font_family: fontFamily,
        rotation,
        text_color: textColor,
        [field]: value
      }
    };
    onUpdate(updates);
  };

  const handleNameChange = (newName: string) => {
    setUnitName(newName);
    onUpdate({ label: newName });
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Edit Properties Storage Unit
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Position: ({unit.x}, {unit.y}) | Size: {unit.width}x{unit.height}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="unit-name">Name</Label>
              <Input
                id="unit-name"
                value={unitName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter storage unit name"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Storage Type</Label>
              <RadioGroup value={typeStorage} onValueChange={handleTypeChange} className="mt-2">
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={StorageTypeEnum.WAREHOUSE} id="warehouse" />
                    <Label htmlFor="warehouse" className="flex items-center gap-2 cursor-pointer">
                      <Palette className="h-4 w-4 text-blue-500" />
                      Warehouse
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={StorageTypeEnum.RACK} id="rack" />
                    <Label htmlFor="rack" className="flex items-center gap-2 cursor-pointer">
                      <Palette className="h-4 w-4 text-yellow-500" />
                      Rack
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Type className="h-4 w-4" />
                Text Styling
              </Label>
              
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fontSize" className="text-xs">Font Size</Label>
                    <Input
                      id="fontSize"
                      type="number"
                      value={fontSize}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setFontSize(value);
                        handleTextStyleUpdate('font_size', value);
                      }}
                      min="8"
                      max="72"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fontFamily" className="text-xs">Font Family</Label>
                    <Select 
                      value={fontFamily} 
                      onValueChange={(value) => {
                        setFontFamily(value);
                        handleTextStyleUpdate('font_family', value);
                      }}
                    >
                      <SelectTrigger id="fontFamily" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontFamilies.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Text Rotation</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRotate}
                      className="flex items-center gap-2 mt-1 w-full"
                    >
                      <RotateCw className="h-4 w-4" />
                      {rotation}°
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="textColor" className="text-xs">Text Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="textColor"
                        type="color"
                        value={textColor}
                        onChange={(e) => {
                          setTextColor(e.target.value);
                          handleTextStyleUpdate('text_color', e.target.value);
                        }}
                        className="h-9 w-16"
                      />
                      <Input
                        value={textColor}
                        onChange={(e) => {
                          setTextColor(e.target.value);
                          handleTextStyleUpdate('text_color', e.target.value);
                        }}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Label className="text-xs">Preview</Label>
                  <div className="border rounded p-4 mt-1 flex items-center justify-center min-h-[60px]">
                    <span
                      style={{
                        fontSize: `${fontSize}px`,
                        fontFamily: fontFamily,
                        color: textColor,
                        transform: `rotate(${rotation}deg)`,
                        transformOrigin: 'center',
                        display: 'inline-block',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {unitName || 'Preview Text'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="destructive" onClick={onDelete}>
              Delete Storage Unit
            </Button>
            <Button onClick={() => onOpenChange(false)}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
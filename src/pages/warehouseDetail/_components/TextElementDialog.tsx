import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextElement } from '@/types/warehouse';
import { Type, RotateCw, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TextElementDialogProps {
  element: TextElement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<TextElement>) => void;
  onDelete: (id: string) => void;
}

const fontFamilies = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'system-ui', label: 'System UI' },
];

export const TextElementDialog = ({ element, open, onOpenChange, onUpdate, onDelete }: TextElementDialogProps) => {
  const [text, setText] = useState(element?.text || '');
  const [fontSize, setFontSize] = useState(element?.fontSize || 16);
  const [fontFamily, setFontFamily] = useState(element?.fontFamily || 'Arial, sans-serif');
  const [rotation, setRotation] = useState(element?.rotation || 0);
  const [color, setColor] = useState(element?.color || '#000000');

  useEffect(() => {
    if (element) {
      setText(element.text);
      setFontSize(element.fontSize);
      setFontFamily(element.fontFamily);
      setRotation(element.rotation);
      setColor(element.color || '#000000');
    }
  }, [element]);

  if (!element) return null;

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    onUpdate(element.id, { rotation: newRotation });
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    onUpdate(element.id, { text: newText });
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    onUpdate(element.id, { fontSize: newSize });
  };

  const handleFontFamilyChange = (newFamily: string) => {
    setFontFamily(newFamily);
    onUpdate(element.id, { fontFamily: newFamily });
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    onUpdate(element.id, { color: newColor });
  };

  const handleDelete = () => {
    onDelete(element.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Edit Text Element
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Position: ({Math.round(element.x)}, {Math.round(element.y)})
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Text</Label>
              <Input
                id="text"
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Enter text"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fontSize">Font Size</Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  min="8"
                  max="72"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
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
                <Label>Text Rotation</Label>
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
                <Label htmlFor="color">Text Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="h-9 w-16"
                  />
                  <Input
                    value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Label>Preview</Label>
              <div className="border rounded p-4 mt-1 flex items-center justify-center min-h-[80px]">
                <span
                  style={{
                    fontSize: `${fontSize}px`,
                    fontFamily: fontFamily,
                    color: color,
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                    display: 'inline-block',
                  }}
                >
                  {text || 'Preview Text'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Text
            </Button>
            <Button onClick={() => onOpenChange(false)}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { 
  Pentagon, 
  Plus, 
  MapPin, 
  Route, 
  Undo, 
  Grid3x3,
  Save,
  Trash2
} from "lucide-react";
import { Slider } from "../ui/slider";

interface Zone {
  id: string;
  name: string;
  capacity: number;
  riskLevel: "low" | "medium" | "high";
  color: string;
  allowedRoles: string[];
}

export function VenueMapping() {
  const [drawMode, setDrawMode] = useState<"polygon" | "zone" | "gate" | "route" | null>(null);
  const [zones, setZones] = useState<Zone[]>([
    { id: "1", name: "Main Stage", capacity: 5000, riskLevel: "high", color: "#FF6A00", allowedRoles: ["all"] },
    { id: "2", name: "VIP Area", capacity: 500, riskLevel: "low", color: "#0B3D91", allowedRoles: ["vip", "security"] },
  ]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [snapToBuildings, setSnapToBuildings] = useState(true);

  const selectedZoneData = zones.find(z => z.id === selectedZone);

  const updateZone = (id: string, updates: Partial<Zone>) => {
    setZones(zones.map(z => z.id === id ? { ...z, ...updates } : z));
  };

  return (
    <div className="h-screen flex">
      {/* Left Toolbar */}
      <div className="w-20 bg-card border-r flex flex-col items-center py-4 gap-4">
        <Button
          variant={drawMode === "polygon" ? "default" : "ghost"}
          size="icon"
          className="w-12 h-12"
          onClick={() => setDrawMode(drawMode === "polygon" ? null : "polygon")}
        >
          <Pentagon className="w-5 h-5" />
        </Button>
        
        <Button
          variant={drawMode === "zone" ? "default" : "ghost"}
          size="icon"
          className="w-12 h-12"
          onClick={() => setDrawMode(drawMode === "zone" ? null : "zone")}
        >
          <Plus className="w-5 h-5" />
        </Button>
        
        <Button
          variant={drawMode === "gate" ? "default" : "ghost"}
          size="icon"
          className="w-12 h-12"
          onClick={() => setDrawMode(drawMode === "gate" ? null : "gate")}
        >
          <MapPin className="w-5 h-5" />
        </Button>
        
        <Button
          variant={drawMode === "route" ? "default" : "ghost"}
          size="icon"
          className="w-12 h-12"
          onClick={() => setDrawMode(drawMode === "route" ? null : "route")}
        >
          <Route className="w-5 h-5" />
        </Button>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12"
        >
          <Undo className="w-5 h-5" />
        </Button>
        
        <Button
          variant={snapToBuildings ? "default" : "ghost"}
          size="icon"
          className="w-12 h-12"
          onClick={() => setSnapToBuildings(!snapToBuildings)}
        >
          <Grid3x3 className="w-5 h-5" />
        </Button>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-[#F3F4F6]">
          {/* Simulated Map */}
          <div className="w-full h-full relative">
            {/* Grid Background */}
            <div 
              className="absolute inset-0" 
              style={{
                backgroundImage: 'linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)',
                backgroundSize: '50px 50px'
              }}
            />
            
            {/* Zones */}
            {zones.map((zone, index) => (
              <div
                key={zone.id}
                className={`absolute cursor-pointer hover:opacity-80 transition-opacity ${
                  selectedZone === zone.id ? 'ring-2 ring-primary' : ''
                }`}
                style={{
                  left: `${20 + index * 15}%`,
                  top: `${30 + index * 10}%`,
                  width: '200px',
                  height: '150px',
                  backgroundColor: `${zone.color}40`,
                  border: `2px solid ${zone.color}`,
                  borderRadius: '8px',
                }}
                onClick={() => setSelectedZone(zone.id)}
              >
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="bg-white/90">
                    {zone.name}
                  </Badge>
                </div>
              </div>
            ))}
            
            {/* Instructions Overlay */}
            {drawMode && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <Card className="p-4 bg-white/95 backdrop-blur">
                  <p className="text-foreground">
                    {drawMode === "polygon" && "Click to place vertices. Press Enter to complete."}
                    {drawMode === "zone" && "Click to place zone marker. Drag to define area."}
                    {drawMode === "gate" && "Click to place gate entrance marker."}
                    {drawMode === "route" && "Click to define route waypoints."}
                  </p>
                </Card>
              </div>
            )}

            {/* Mini Map */}
            <div className="absolute top-4 right-4">
              <Card className="w-32 h-32 p-2 bg-white/95 backdrop-blur">
                <div className="w-full h-full bg-[#E5E7EB] rounded" />
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          <Button className="bg-[#16A34A] hover:bg-[#16A34A]/90">
            <Save className="w-4 h-4 mr-2" />
            Save & Validate
          </Button>
          <Button variant="outline">
            Export GeoJSON
          </Button>
        </div>
      </div>

      {/* Right Inspector Panel */}
      <div className="w-80 bg-card border-l p-6 overflow-y-auto">
        {selectedZoneData ? (
          <div className="space-y-6">
            <div>
              <h3>Zone Properties</h3>
              <p className="text-muted-foreground mt-1">Configure selected zone</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zone-name">Zone Name</Label>
                <Input
                  id="zone-name"
                  value={selectedZoneData.name}
                  onChange={(e) => updateZone(selectedZone, { name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone-capacity">Capacity</Label>
                <Input
                  id="zone-capacity"
                  type="number"
                  value={selectedZoneData.capacity}
                  onChange={(e) => updateZone(selectedZone, { capacity: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Risk Level</Label>
                <div className="flex gap-2">
                  {["low", "medium", "high"].map((level) => (
                    <Button
                      key={level}
                      variant={selectedZoneData.riskLevel === level ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 capitalize ${
                        selectedZoneData.riskLevel === level && level === "low" ? "bg-[#16A34A] hover:bg-[#16A34A]/90" :
                        selectedZoneData.riskLevel === level && level === "medium" ? "bg-[#F59E0B] hover:bg-[#F59E0B]/90" :
                        selectedZoneData.riskLevel === level && level === "high" ? "bg-[#E02D2D] hover:bg-[#E02D2D]/90" : ""
                      }`}
                      onClick={() => updateZone(selectedZone, { riskLevel: level as any })}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Zone Color</Label>
                <div className="flex gap-2">
                  {["#FF6A00", "#0B3D91", "#16A34A", "#F59E0B", "#E02D2D"].map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded border-2 ${
                        selectedZoneData.color === color ? "border-foreground" : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateZone(selectedZone, { color })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Allowed Roles</Label>
                <div className="space-y-2">
                  {["all", "vip", "security", "medical", "staff"].map((role) => (
                    <div key={role} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`role-${role}`}
                        checked={selectedZoneData.allowedRoles.includes(role)}
                        onChange={(e) => {
                          const newRoles = e.target.checked
                            ? [...selectedZoneData.allowedRoles, role]
                            : selectedZoneData.allowedRoles.filter(r => r !== role);
                          updateZone(selectedZone, { allowedRoles: newRoles });
                        }}
                        className="w-4 h-4"
                      />
                      <Label htmlFor={`role-${role}`} className="capitalize font-normal cursor-pointer">
                        {role}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setZones(zones.filter(z => z.id !== selectedZone));
                    setSelectedZone(null);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Zone
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3>Zone List</h3>
              <p className="text-muted-foreground mt-1">Select a zone to edit</p>
            </div>

            <div className="space-y-2">
              {zones.map((zone) => (
                <Card
                  key={zone.id}
                  className="p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedZone(zone.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: zone.color }}
                        />
                        <h4>{zone.name}</h4>
                      </div>
                      <p className="text-muted-foreground">
                        Capacity: {zone.capacity}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          zone.riskLevel === "low" ? "bg-[#16A34A]/10 text-[#16A34A]" :
                          zone.riskLevel === "medium" ? "bg-[#F59E0B]/10 text-[#F59E0B]" :
                          "bg-[#E02D2D]/10 text-[#E02D2D]"
                        }
                      >
                        {zone.riskLevel}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button
              className="w-full"
              onClick={() => {
                const newZone: Zone = {
                  id: Date.now().toString(),
                  name: `Zone ${zones.length + 1}`,
                  capacity: 1000,
                  riskLevel: "low",
                  color: "#0B3D91",
                  allowedRoles: ["all"],
                };
                setZones([...zones, newZone]);
                setSelectedZone(newZone.id);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Zone
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

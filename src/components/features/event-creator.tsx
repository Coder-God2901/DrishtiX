import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { 
  Users, 
  Calendar, 
  MapPin,
  Clock,
  Plus,
  X
} from "lucide-react";
import { Badge } from "../ui/badge";
import { eventTypes, metaFormFields } from "../../data/event-metadata";

export function EventCreator() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [listValues, setListValues] = useState<Record<string, string[]>>({});

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setFormData({});
    setListValues({});
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleListAdd = (name: string, value: string) => {
    if (value.trim()) {
      setListValues(prev => ({
        ...prev,
        [name]: [...(prev[name] || []), value.trim()]
      }));
    }
  };

  const handleListRemove = (name: string, index: number) => {
    setListValues(prev => ({
      ...prev,
      [name]: prev[name].filter((_, i) => i !== index)
    }));
  };

  if (!selectedType) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1>Create New Event</h1>
            <p className="text-muted-foreground mt-2">
              Select your event type to get started with a customized creation flow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card 
                  key={type.id}
                  className="p-6 cursor-pointer hover:shadow-lg transition-all hover:border-primary"
                  onClick={() => handleTypeSelect(type.id)}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3>{type.name}</h3>
                      <p className="text-muted-foreground mt-1">{type.subtitle}</p>
                    </div>
                    <Button variant="outline" className="w-full">
                      Select
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const selectedEventType = eventTypes.find(t => t.id === selectedType);
  const fields = metaFormFields[selectedType] || [];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1>Create {selectedEventType?.name}</h1>
              <Badge variant="outline">{selectedEventType?.name}</Badge>
            </div>
            <p className="text-muted-foreground mt-2">{selectedEventType?.subtitle}</p>
          </div>
          <Button variant="ghost" onClick={() => setSelectedType(null)}>
            Back to Event Types
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="space-y-6">
                {fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-[#E02D2D] ml-1">*</span>}
                    </Label>
                    
                    {field.type === "text" && (
                      <Input
                        id={field.name}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                    
                    {field.type === "number" && (
                      <Input
                        id={field.name}
                        type="number"
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                    
                    {field.type === "textarea" && (
                      <Textarea
                        id={field.name}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        rows={3}
                      />
                    )}
                    
                    {(field.type === "date" || field.type === "datetime-local") && (
                      <Input
                        id={field.name}
                        type={field.type}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                      />
                    )}
                    
                    {field.type === "boolean" && (
                      <div className="flex items-center gap-2">
                        <input
                          id={field.name}
                          type="checkbox"
                          checked={formData[field.name] || false}
                          onChange={(e) => handleInputChange(field.name, e.target.checked)}
                          className="w-4 h-4"
                        />
                        <Label htmlFor={field.name} className="font-normal cursor-pointer">
                          Yes
                        </Label>
                      </div>
                    )}
                    
                    {field.type === "list" && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id={`${field.name}-input`}
                            placeholder={`Add ${field.label.toLowerCase()}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const target = e.target as HTMLInputElement;
                                handleListAdd(field.name, target.value);
                                target.value = '';
                              }
                            }}
                          />
                          <Button
                            type="button"
                            size="icon"
                            onClick={() => {
                              const input = document.getElementById(`${field.name}-input`) as HTMLInputElement;
                              if (input) {
                                handleListAdd(field.name, input.value);
                                input.value = '';
                              }
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(listValues[field.name] || []).map((item, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                              {item}
                              <X 
                                className="w-3 h-3 cursor-pointer" 
                                onClick={() => handleListRemove(field.name, index)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {field.help && (
                      <p className="text-muted-foreground">{field.help}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Preview Column */}
          <div className="space-y-4">
            <Card className="p-6 sticky top-4">
              <h3 className="mb-4">Event Preview</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Event Details</span>
                  </div>
                  <p className="text-foreground">
                    {formData.eventName || "Untitled Event"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Location</span>
                  </div>
                  <p className="text-foreground">
                    {formData.venue || formData.location || "Not specified"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Expected Attendees</span>
                  </div>
                  <p className="text-foreground">
                    {formData.expectedAttendees || formData.expectedParticipants || "0"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Duration</span>
                  </div>
                  <p className="text-foreground">
                    {formData.duration ? `${formData.duration} hours` : "Not specified"}
                  </p>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <h4>Safety Score</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#16A34A] transition-all" 
                        style={{ width: "75%" }}
                      />
                    </div>
                    <span className="text-muted-foreground">75%</span>
                  </div>
                  <p className="text-muted-foreground">
                    Estimated based on event parameters
                  </p>
                </div>
              </div>
            </Card>

            <div className="sticky top-[calc(100vh-8rem)] space-y-2">
              <Button className="w-full bg-[#FF6A00] hover:bg-[#FF6A00]/90">
                Publish Event
              </Button>
              <Button variant="outline" className="w-full">
                Save Draft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

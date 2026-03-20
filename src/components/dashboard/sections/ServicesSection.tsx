import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, Edit2, X, Check } from "lucide-react";
import { serviceSchema } from "@/lib/validations";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  display_order: number;
}

const defaultIcons = ["💻", "📱", "☁️", "🔧", "🎨", "📊", "🔒", "⚡"];

export const ServicesSection = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    icon: "💻",
  });

  useEffect(() => {
    fetchServices();
  }, [userId]);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("user_id", userId)
      .order("display_order");

    if (error) {
      toast.error("Error loading services");
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const handleAddService = async () => {
    const result = serviceSchema.safeParse(newService);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    
    setErrors({});

    const { data, error } = await supabase
      .from("services")
      .insert({
        user_id: userId,
        title: newService.title.trim(),
        description: newService.description.trim(),
        icon: newService.icon.slice(0, 10),
        display_order: services.length,
      })
      .select()
      .single();

    if (error) {
      toast.error("Error adding service");
    } else {
      setServices([...services, data]);
      setNewService({ title: "", description: "", icon: "💻" });
      toast.success("Service added successfully");
    }
  };

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting service");
    } else {
      setServices(services.filter((s) => s.id !== id));
      toast.success("Service deleted");
    }
  };

  const handleUpdateService = async (service: Service) => {
    const { error } = await supabase
      .from("services")
      .update({
        title: service.title.slice(0, 200),
        description: service.description?.slice(0, 1000),
        icon: service.icon.slice(0, 10),
      })
      .eq("id", service.id);

    if (error) {
      toast.error("Error updating service");
    } else {
      setEditingId(null);
      toast.success("Service updated");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Services</h1>
        <p className="text-muted-foreground">Manage the services you offer</p>
      </div>

      {/* Add New Service */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <h2 className="font-semibold text-foreground mb-4">Add New Service</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Title</label>
            <input
              type="text"
              maxLength={200}
              value={newService.title}
              onChange={(e) => setNewService({ ...newService, title: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.title ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
              placeholder="Web Development"
            />
            {errors.title && <p className="text-destructive text-xs mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Icon</label>
            <div className="flex gap-2">
              {defaultIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setNewService({ ...newService, icon })}
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center text-xl transition-colors ${
                    newService.icon === icon
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              maxLength={1000}
              value={newService.description}
              onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Describe your service..."
            />
          </div>
          <div>
            <Button onClick={handleAddService}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {services.map((service) => (
          <div key={service.id} className="p-6 rounded-xl bg-card border border-border">
            {editingId === service.id ? (
              <div className="space-y-4">
                <input
                  type="text"
                  maxLength={200}
                  value={service.title}
                  onChange={(e) =>
                    setServices(services.map((s) =>
                      s.id === service.id ? { ...s, title: e.target.value } : s
                    ))
                  }
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                />
                <textarea
                  maxLength={1000}
                  value={service.description || ""}
                  onChange={(e) =>
                    setServices(services.map((s) =>
                      s.id === service.id ? { ...s, description: e.target.value } : s
                    ))
                  }
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdateService(service)}>
                    <Check className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{service.title}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditingId(service.id)}>
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteService(service.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No services added yet. Add your first service above!</p>
        </div>
      )}
    </div>
  );
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Mail, MailOpen, Clock, Reply, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  read_at: string | null;
  replied_at: string | null;
}

export const ContactsSection = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    fetchContacts();
  }, [userId]);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading contacts");
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (contact: Contact) => {
    if (contact.status === "unread") {
      const { error } = await supabase
        .from("contacts")
        .update({ status: "read", read_at: new Date().toISOString() })
        .eq("id", contact.id);

      if (!error) {
        setContacts(contacts.map(c => 
          c.id === contact.id ? { ...c, status: "read", read_at: new Date().toISOString() } : c
        ));
      }
    }
    setSelectedContact(contact);
  };

  const markAsReplied = async (id: string) => {
    const { error } = await supabase
      .from("contacts")
      .update({ status: "replied", replied_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Error updating contact");
    } else {
      setContacts(contacts.map(c => 
        c.id === id ? { ...c, status: "replied", replied_at: new Date().toISOString() } : c
      ));
      if (selectedContact?.id === id) {
        setSelectedContact({ ...selectedContact, status: "replied", replied_at: new Date().toISOString() });
      }
      toast.success("Marked as replied");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting contact");
    } else {
      setContacts(contacts.filter((c) => c.id !== id));
      if (selectedContact?.id === id) {
        setSelectedContact(null);
      }
      toast.success("Contact deleted");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unread":
        return <Badge variant="default" className="bg-primary text-primary-foreground">Unread</Badge>;
      case "read":
        return <Badge variant="secondary">Read</Badge>;
      case "replied":
        return <Badge variant="outline" className="text-green-500 border-green-500">Replied</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const unreadCount = contacts.filter(c => c.status === "unread").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Contact Requests</h1>
        <p className="text-muted-foreground">
          Manage messages from your portfolio visitors
          {unreadCount > 0 && (
            <span className="ml-2 text-primary font-medium">({unreadCount} unread)</span>
          )}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Contacts List */}
        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-border rounded-xl bg-card">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No contact requests yet.</p>
              <p className="text-sm">Messages from your portfolio will appear here.</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => markAsRead(contact)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedContact?.id === contact.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                } ${contact.status === "unread" ? "border-l-4 border-l-primary" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {contact.status === "unread" ? (
                        <Mail size={16} className="text-primary shrink-0" />
                      ) : (
                        <MailOpen size={16} className="text-muted-foreground shrink-0" />
                      )}
                      <span className={`font-medium truncate ${contact.status === "unread" ? "text-foreground" : "text-muted-foreground"}`}>
                        {contact.name}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${contact.status === "unread" ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {contact.subject}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{contact.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {getStatusBadge(contact.status)}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={10} />
                      {format(new Date(contact.created_at), "MMM d")}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contact Detail */}
        {selectedContact && (
          <div className="p-6 rounded-xl bg-card border border-border animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selectedContact.subject}</h2>
                <p className="text-sm text-muted-foreground">
                  From: {selectedContact.name} ({selectedContact.email})
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(selectedContact.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              {getStatusBadge(selectedContact.status)}
            </div>

            <div className="p-4 rounded-lg bg-background border border-border mb-4">
              <p className="text-foreground whitespace-pre-wrap">{selectedContact.message}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => window.open(`mailto:${selectedContact.email}?subject=Re: ${encodeURIComponent(selectedContact.subject)}`, "_blank")}
              >
                <Reply size={14} className="mr-1" />
                Reply via Email
                <ExternalLink size={12} className="ml-1" />
              </Button>
              {selectedContact.status !== "replied" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsReplied(selectedContact.id)}
                >
                  Mark as Replied
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(selectedContact.id)}
              >
                <Trash2 size={14} className="mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

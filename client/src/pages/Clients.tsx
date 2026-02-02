import { Layout } from "@/components/Layout";
import { useClients, useCreateClient } from "@/hooks/use-clients";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Mail, Phone, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";

export default function Clients() {
  const [search, setSearch] = useState("");
  const { data: clients, isLoading } = useClients({ search });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clients</h1>
            <p className="text-slate-500">Manage your customer database.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20">
                <Plus className="mr-2 h-4 w-4" /> Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <ClientForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search clients..." 
              className="pl-10 border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-10 text-muted-foreground">Loading clients...</div>
          ) : clients?.map(client => (
            <div key={client.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{client.name}</h3>
                  <p className="text-sm text-slate-500">ID: #{client.id}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                  {client.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                {client.email && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-orange-500" />
                    {client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-orange-500" />
                    {client.phone}
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    {client.address}
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-orange-600">
                  View History
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

function ClientForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreateClient();
  
  const form = useForm<z.infer<typeof insertClientSchema>>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      taxId: "",
    },
  });

  const onSubmit = (data: z.infer<typeof insertClientSchema>) => {
    mutate(data, {
      onSuccess: () => {
        toast({ title: "Client created" });
        onSuccess();
      },
      onError: () => toast({ title: "Failed", variant: "destructive" })
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl><Input {...field} value={field.value || ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="pt-4">
          <Button type="submit" disabled={isPending} className="bg-orange-600 hover:bg-orange-700">
            {isPending ? "Creating..." : "Save Client"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

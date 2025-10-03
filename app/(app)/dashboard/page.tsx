import {
  Book,
  Bookmark,
  Heart,
  LayoutGrid,
  Library,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { getDashboardStats } from "@/app/actions/dashboardActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Componente para cartões de estatísticas
function StatCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// Componente para cartões de navegação
function NavCard({ title, href, icon: Icon, className }: { title: string, href: string, icon: React.ElementType, className?: string }) {
    return (
        <Link href={href} className={cn("block group", className)}>
            <Card className="hover:bg-primary/10 hover:border-primary transition-colors h-full">
                <CardHeader>
                    <div className="bg-primary/20 text-primary w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                        <Icon size={24} />
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">{title}</CardTitle>
                </CardHeader>
            </Card>
        </Link>
    )
}

export default async function DashboardHomePage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {/* Secção de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Livros na Biblioteca" value={stats.totalBooks} icon={Library} />
        <StatCard title="Livros Lidos" value={stats.booksRead} icon={Book} />
        <StatCard title="Trechos Salvos" value={stats.totalHighlights} icon={Bookmark} />
        <StatCard title="Seguidores" value={stats.followersCount} icon={Users} />
        <StatCard title="A Seguir" value={stats.followingCount} icon={Heart} />
        <StatCard title="Créditos" value={stats.credits} icon={Sparkles} />
      </div>

      {/* Secção de Acesso Rápido */}
      <div className="mt-8">
        <h3 className="text-2xl font-bold tracking-tight mb-4">Acesso Rápido</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <NavCard title="Minha Biblioteca" href="/dashboard/library" icon={Library} />
            <NavCard title="Meus Trechos" href="/dashboard/highlights" icon={Bookmark} />
            <NavCard title="Comunidades" href="/communities" icon={LayoutGrid} />
            <NavCard title="Configurações" href="/dashboard/settings" icon={Settings} />
        </div>
      </div>
    </div>
  );
}
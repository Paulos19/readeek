"use client";

import { manageMemberRole, banUserFromCommunity } from "@/app/actions/communityActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Prisma, CommunityRole } from "@prisma/client";
import { Crown, MoreVertical, Star, Trash2, User } from "lucide-react";
import { useSession } from "next-auth/react";

type CommunityWithMembers = Prisma.CommunityGetPayload<{
    include: {
        members: {
            include: { user: { select: { id: true, name: true, image: true } } }
        }
    }
}>;

// --- COMPONENTE CORRIGIDO ---
// A lógica foi alterada para garantir que apenas um elemento é retornado dentro do TooltipTrigger.
function RoleIcon({ role }: { role: CommunityRole }) {
    let icon: React.ReactNode;
    let label: string;

    switch (role) {
        case 'OWNER':
            icon = <Crown className="h-5 w-5 text-yellow-500" />;
            label = "Dono";
            break;
        case 'HONORARY_MEMBER':
            icon = <Star className="h-5 w-5 text-blue-500" />;
            label = "Membro Honorário";
            break;
        default:
            icon = <User className="h-5 w-5 text-muted-foreground" />;
            label = "Membro";
            break;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {/* Agora, a variável 'icon' contém o único elemento filho esperado */}
                    {icon}
                </TooltipTrigger>
                <TooltipContent>
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default function MembersManagementTab({ community }: { community: CommunityWithMembers }) {
    const { data: session } = useSession();
    const { toast } = useToast();

    const handleRoleChange = async (targetUserId: string, newRole: CommunityRole) => {
        const result = await manageMemberRole(community.id, targetUserId, newRole);
        if (result.error) {
            toast({ title: "Erro", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Sucesso", description: "O cargo do membro foi atualizado." });
        }
    };

    const handleBan = async (targetUserId: string) => {
        if (confirm("Tem a certeza que quer banir este utilizador permanentemente?")) {
            const result = await banUserFromCommunity(community.id, targetUserId);
            if (result.error) {
                toast({ title: "Erro", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "Sucesso", description: "O utilizador foi banido e removido da comunidade." });
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gerir Membros</CardTitle>
                <CardDescription>
                    Promova membros para permitir que enviem materiais de estudo ou remova utilizadores da comunidade.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {community.members.map(({ user, role }) => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={user.image ?? undefined} />
                                <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{user.name}</p>
                                <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    <RoleIcon role={role} />
                                    <span>
                                        {role === 'OWNER' ? 'Dono' : role === 'HONORARY_MEMBER' ? 'Membro Honorário' : 'Membro'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {session?.user?.id === community.ownerId && user.id !== session.user.id && (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {role === 'MEMBER' && (
                                        <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'HONORARY_MEMBER')}>
                                            <Star className="h-4 w-4 mr-2" /> Promover a Honorário
                                        </DropdownMenuItem>
                                    )}
                                     {role === 'HONORARY_MEMBER' && (
                                        <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'MEMBER')}>
                                            <User className="h-4 w-4 mr-2" /> Rebaixar para Membro
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleBan(user.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" /> Expulsar e Banir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
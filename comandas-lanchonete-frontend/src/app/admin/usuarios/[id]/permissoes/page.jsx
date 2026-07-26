import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import UsuarioPermissoesClient from "./UsuarioPermissoesClient";

export default async function PermissoesPage({ params }) {
    const resolvedParams = await params;
    const userId = resolvedParams?.id;

    return (
        <Can permission="permissoes.visualizar" fallback={<AccessDenied />}>
            <UsuarioPermissoesClient userId={userId} />
        </Can>
    );
}
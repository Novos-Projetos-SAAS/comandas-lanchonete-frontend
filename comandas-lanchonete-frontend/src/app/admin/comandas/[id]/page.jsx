import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import ComandaDetalhesClient from "./ComandaDetalhesClient";

export const metadata = { title: "Gerenciar Comanda | Admin" };

export default function ComandaDetalhesPage() {
    return (
        <Can perform="comandas.listar" fallback={<AccessDenied />}>
            <ComandaDetalhesClient />
        </Can>
    );
}
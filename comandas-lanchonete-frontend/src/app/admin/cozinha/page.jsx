import Can from "@/components/ui/can/Can";
import AccessDenied from "@/components/ui/accessDenied";
import CozinhaClient from "./CozinhaClient";

export const metadata = { title: "Cozinha | Admin" };

export default function CozinhaPage() {
    return (
        <Can perform="cozinha.fila" fallback={<AccessDenied />}>
            <CozinhaClient />
        </Can>
    );
}
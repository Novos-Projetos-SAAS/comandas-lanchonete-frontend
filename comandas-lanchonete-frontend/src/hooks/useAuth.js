import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export const useAuth = () => {
    const context = useContext(AuthContext);

    // Essa trava de segurança é ótima: se você tentar usar o useAuth
    // fora do layout principal (sem o Provider), ele te avisa com um erro claro.
    if (context === undefined) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }

    return context;
};
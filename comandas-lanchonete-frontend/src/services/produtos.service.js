import api from "@/lib/api";

export async function listarProdutos({
    pagina=1,
    termo="",
    ativo="todos",
    categoriaId="",
    limite=12,
    somenteComPreco=false
}={}){
    const params={
        pagina,
        limite
    };

    if(termo.trim()){
        params.termo=termo.trim();
    }

    if(categoriaId){
        params.categoria_produtos_id=categoriaId;
    }

    if(ativo==="ativos"){
        params.ativo=true;
    }

    if(ativo==="inativos"){
        params.ativo=false;
    }

    if(somenteComPreco){
        params.somente_com_preco=true;
    }

    const response=await api.get(
        "/produtos",
        {params}
    );

    return response.data;
}

export async function obterProdutoPorId(id){
    const response=await api.get(
        `/produtos/${id}`
    );

    return response.data;
}

export async function listarCategoriasProduto(){
    const response=await api.get(
        "/produtos/categorias-opcoes"
    );

    return response.data;
}

export async function criarProduto(payload){
    const response=await api.post(
        "/produtos",
        payload
    );

    return response.data;
}

export async function atualizarProduto(id,payload){
    const response=await api.patch(
        `/produtos/${id}`,
        payload
    );

    return response.data;
}

export async function inativarProduto(id){
    const response=await api.patch(
        `/produtos/${id}/inativar`
    );

    return response.data;
}

export async function reativarProduto(id){
    const response=await api.patch(
        `/produtos/${id}/reativar`
    );

    return response.data;
}
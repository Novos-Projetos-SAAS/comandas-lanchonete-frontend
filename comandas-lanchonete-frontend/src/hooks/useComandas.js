"use client";

import { useCallback,useEffect,useRef,useState } from "react";
import {
    abrirComanda as abrirComandaApi,
    listarComandas as listarComandasApi,
    obterComandaPorId
} from "@/services/comandas.service";
import { listarMesas as listarMesasApi } from "@/services/mesas.service";
import {
    atualizarComandaNaLista,
    reconciliarComandas
} from "@/utils/comandas.utils";
import { conectarSocket } from "@/lib/socket";

export function useComandas({carregarLista=true}={}){
    const [comandas,setComandas]=useState([]);
    const [loading,setLoading]=useState(carregarLista);
    const [page,setPageInternal]=useState(1);
    const [totalPages,setTotalPages]=useState(1);
    const [totalRecords,setTotalRecords]=useState(0);
    const [statusFilter,setStatusFilterInternal]=useState("");
    const [lastUpdate,setLastUpdate]=useState(null);
    const [mesasDisponiveis,setMesasDisponiveis]=useState([]);
    const [loadingMesas,setLoadingMesas]=useState(false);

    const comandasRef=useRef([]);

    useEffect(()=>{
        comandasRef.current=comandas;
    },[comandas]);

    const carregarComandas=useCallback(async({silencioso=false}={})=>{
        if(!silencioso)setLoading(true);

        try{
            const response=await listarComandasApi({
                pagina:page,
                status:statusFilter,
                limite:30
            });

            const payload=response?.data||response;
            const paginacao=payload?.paginacao||{};
            const recebidas=Array.isArray(payload?.comandas)?payload.comandas:[];

            setComandas(atuais=>reconciliarComandas(atuais,recebidas));
            setTotalPages(paginacao.total_paginas||1);
            setTotalRecords(paginacao.total_registros||0);
            setLastUpdate(new Date());

            if(paginacao.pagina_atual&&paginacao.pagina_atual!==page){
                setPageInternal(paginacao.pagina_atual);
            }

            return recebidas;
        }catch(error){
            if(!silencioso)setComandas([]);
            throw error;
        }finally{
            if(!silencioso)setLoading(false);
        }
    },[page,statusFilter]);

    const carregarMesasDisponiveis=useCallback(async()=>{
        setLoadingMesas(true);

        try{
            const response=await listarMesasApi({
                pagina:1,
                situacao:"livres",
                limite:120
            });

            const payload=response?.data||response;
            const lista=Array.isArray(payload?.mesas)?payload.mesas:[];

            setMesasDisponiveis(lista);

            return lista;
        }catch(error){
            setMesasDisponiveis([]);
            throw error;
        }finally{
            setLoadingMesas(false);
        }
    },[]);

    const setPage=useCallback(novaPagina=>{
        setPageInternal(novaPagina);
    },[]);

    const setStatusFilter=useCallback(novoStatus=>{
        setStatusFilterInternal(novoStatus);
        setPageInternal(1);
    },[]);

    const buscarComandaPorId=useCallback(async id=>{
        const response=await obterComandaPorId(id);

        return (
            response?.data?.comanda||
            response?.comanda||
            response
        );
    },[]);

    const atualizarComanda=useCallback(async id=>{
        const atualizada=await buscarComandaPorId(id);

        const existeNaLista=comandasRef.current.some(
            comanda=>String(comanda.id)===String(atualizada.id)
        );

        const saiuDoFiltro=Boolean(
            statusFilter&&
            atualizada.status!==statusFilter
        );

        setComandas(atuais=>
            atualizarComandaNaLista(
                atuais,
                atualizada,
                statusFilter
            )
        );

        if(existeNaLista&&saiuDoFiltro){
            setTotalRecords(total=>Math.max(total-1,0));
        }

        setLastUpdate(new Date());

        return atualizada;
    },[buscarComandaPorId,statusFilter]);

    useEffect(()=>{
        if(!carregarLista)return undefined;

        carregarComandas().catch(()=>{});

        return undefined;
    },[carregarLista,carregarComandas]);

    useEffect(()=>{
        if(!carregarLista)return undefined;

        const intervalId=window.setInterval(()=>{
            carregarComandas({
                silencioso:true
            }).catch(()=>{});
        },45000);

        return()=>{
            window.clearInterval(intervalId);
        };
    },[carregarLista,carregarComandas]);

    useEffect(()=>{
        if(!carregarLista)return undefined;

        const socket=conectarSocket();

        if(!socket)return undefined;

        const entrarNaSala=()=>{
            socket.emit("entrar_sala","comandas");
        };

        const handleComandaAtualizada=dados=>{
            const id=dados?.id??dados?.comanda_id;

            if(!id)return;

            const estaNaTela=comandasRef.current.some(
                comanda=>String(comanda.id)===String(id)
            );

            if(!estaNaTela)return;

            atualizarComanda(id).catch(()=>{
                carregarComandas({
                    silencioso:true
                }).catch(()=>{});
            });
        };

        const handleListaAtualizada=()=>{
            carregarComandas({
                silencioso:true
            }).catch(()=>{});
        };

        socket.on("connect",entrarNaSala);
        socket.on("comanda_atualizada",handleComandaAtualizada);
        socket.on("comandas_lista_atualizada",handleListaAtualizada);

        if(socket.connected)entrarNaSala();

        return()=>{
            socket.off("connect",entrarNaSala);
            socket.off("comanda_atualizada",handleComandaAtualizada);
            socket.off("comandas_lista_atualizada",handleListaAtualizada);
            socket.emit("sair_sala","comandas");
        };
    },[
        carregarLista,
        atualizarComanda,
        carregarComandas
    ]);

    const abrirComanda=useCallback(async payload=>{
        const response=await abrirComandaApi(payload);

        if(carregarLista){
            await carregarComandas({
                silencioso:true
            });
        }

        return response;
    },[
        carregarLista,
        carregarComandas
    ]);

    return {
        comandas,
        loading,
        page,
        setPage,
        totalPages,
        totalRecords,
        statusFilter,
        setStatusFilter,
        lastUpdate,
        mesasDisponiveis,
        loadingMesas,
        listarComandas:carregarComandas,
        carregarMesasDisponiveis,
        buscarComandaPorId,
        atualizarComanda,
        abrirComanda
    };
}

# INICIAR

Abrir sessão de trabalho neste projeto.

**Não é** criar o projeto do zero — é carregar a memória salva em `_ia/` e continuar de onde parou (ou fazer o bootstrap na primeira sessão real).

---

## Identificar o modo

Olhe `_ia/ESTADO.md` e `_ia/DIARIO.md` antes de agir:

| Condição | Modo | O que fazer |
|----------|------|-------------|
| Fase = **Inicial** e DIARIO sem entradas de trabalho real | **Bootstrap** | Seguir a próxima ação de ESTADO (geralmente definir objetivo). Não recriar arquivos que o template já criou. |
| Fase ≠ Inicial **ou** DIARIO com entradas anteriores | **Retomada** | Continuar a partir de ESTADO.md e DIARIO.md. **Nunca** reiniciar do zero nem refazer o que já está registrado. |

---

## Leitura (nesta ordem)

1. `_ia/LEIA-IA.md`
2. `_ia/CONTRATO_DA_IA.md`
3. `_ia/ESTADO.md`
4. `_ia/TAREFAS.md`
5. `_ia/DECISOES.md`
6. `_ia/RISCOS.md`
7. Últimas 2 entradas de `_ia/DIARIO.md`
8. Último arquivo em `_ia/Historicos/` (se existir)

---

## Apresentar antes de qualquer ação

```
== CONTEXTO ==
Modo:            [Bootstrap | Retomada]
Fase:            ...
Status:          ...
Última ação:     ...
Tarefas abertas: ...
Riscos ativos:   ...
Próxima ação:    ...
```

Depois pergunte:

> "Quer continuar com a próxima ação registrada ou ajustar o foco desta sessão?"

**Não execute nada antes da resposta do humano.**

---

## Regras

- Em **Retomada**, a fonte da verdade é `_ia/`. Ignore suposições do chat anterior.
- Não apagar, recriar ou sobrescrever trabalho já documentado em TAREFAS, DIARIO ou DECISOES.
- Se `_ia/` estiver desatualizado em relação ao que o humano lembra, pergunte antes de corrigir os arquivos.

#!/bin/bash

# Verifica se foram passados pelo menos dois arquivos
if [ "$#" -lt 2 ]; then
  echo "Uso: $0 arquivo1.mp4 arquivo2.mp4 [arquivo3.mp4...]"
  exit 1
fi

# Verifica se todos os arquivos existem
for video in "$@"; do
  if [ ! -f "$video" ]; then
    echo "Erro: Arquivo '$video' não encontrado!"
    exit 1
  fi
done

# Nome fixo para o arquivo de saída
saida="trabalho.mp4"

# Cria o arquivo lista.txt
> lista.txt
for video in "$@"; do
  # Usa printf para lidar melhor com caracteres especiais
  printf "file '%s'\n" "$PWD/$(printf '%q' "$video")" >> lista.txt
done

# Executa o ffmpeg para juntar os vídeos
ffmpeg -f concat -safe 0 -i lista.txt -c copy "$saida"

# Verifica se o ffmpeg foi bem sucedido
if [ $? -eq 0 ]; then
  # Limpa o lista.txt
  rm lista.txt
  echo "Vídeos unidos com sucesso em: $saida"
else
  echo "Erro ao unir os vídeos!"
  exit 1
fi

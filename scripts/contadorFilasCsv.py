import csv

# Método 1: usando un contador de filas
with open("/home/vmorales/Develop/labs/ChatGPT/chess-puzzles/data/fens_mate_verificados.csv", "r", encoding="utf-8") as f:
    line_count = sum(1 for _ in f)

print("El archivo tiene", line_count, "líneas")


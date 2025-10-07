import csv
import json

csv_file = "/home/vmorales/Develop/labs/ChatGPT/chess-puzzles/data/fens_mate_verificados.csv"
json_file = "/home/vmorales/Develop/labs/ChatGPT/chess-puzzles/data/fens_mate_verificados.json"

data = []

with open(csv_file, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        data.append(row)

with open(json_file, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Convertido {csv_file} a {json_file}")


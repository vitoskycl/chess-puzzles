import csv
import chess
import chess.engine

# Rutas
csv_input = "/home/vmorales/Descargas/lichess_db_puzzle.csv"
csv_output = "/home/vmorales/Develop/labs/ChatGPT/chess-puzzles/data/fens_mate_verificados.csv"
STOCKFISH_PATH = "/home/vmorales/Develop/engines/stockfish_14.1/stockfish_14.1_linux_x64"  # Ajusta según tu instalación

# Configuración
mate_n_max = 6          # opcional, para limitar búsqueda a mates hasta N movimientos
time_per_position = 0.5 # segundos que Stockfish analizará cada posición
start_row = 300001           # fila inicial (1 = primera fila de datos, sin contar cabecera)
end_row   = 328404        # fila final

engine = chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)

count_filas = 0
count_total = 0
count_mates = 0

with open(csv_input, newline="", encoding="utf-8") as f_in, \
     open(csv_output, "a", newline="", encoding="utf-8") as f_out:  # "a" para agregar si corres en varias tandas

    reader = csv.DictReader(f_in)
    writer = csv.writer(f_out)

    # Si el archivo está vacío escribe encabezado
    if f_out.tell() == 0:
        writer.writerow(["FEN", "Moves", "MateIn", "Winner"])

    for i, row in enumerate(reader, start=1):  # empieza en 1 para contar filas de datos
        count_filas += 1
        if i < start_row:
            continue
        if i > end_row:
            break

        themes = row.get("Themes", "").lower()
        if "mate" not in themes:
            continue  # solo analizamos puzzles de mate

        fen = row["FEN"]
        moves = row["Moves"]

        board = chess.Board(fen)
        info = engine.analyse(board, chess.engine.Limit(time=time_per_position))
        score = info["score"].white()

        if score.is_mate():
            mate_in = score.mate()  # positivo = blancas ganan, negativo = negras ganan
            if abs(mate_in)>1 and abs(mate_in) <= mate_n_max:
                winner = "White" if mate_in > 0 else "Black"
                writer.writerow([fen, moves, abs(mate_in), winner])
                count_mates += 1

        count_total += 1
        if count_total % 100 == 0:
            print(f"Filas leídas {count_filas}, Filas Analizadas {count_total} posiciones en este bloque, Mates encontrados: {count_mates}")

engine.quit()
print(f"Proceso terminado. Filas leídas {count_filas}, Total mates guardados en este bloque: {count_mates}")

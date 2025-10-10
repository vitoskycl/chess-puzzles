import chess
import chess.engine

fen = "5Q2/pbp3np/1p1pB1pk/1P6/P3q2P/6K1/8/8 b - - 1 32"
STOCKFISH_PATH = "/home/vmorales/Develop/engines/stockfish_14.1/stockfish_14.1_linux_x64"  # Ajusta según tu instalación
time_per_position = 0.5 # segundos que Stockfish analizará cada posición
engine = chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)

board = chess.Board(fen)
info = engine.analyse(board, chess.engine.Limit(time=time_per_position))
score = info["score"].white()
if score.is_mate():
   mate_in = score.mate()  # positivo = blancas ganan, negativo = negras ganan
   winner = "White" if mate_in > 0 else "Black"
   print(f"Ganas las {winner}")
else:   
   print(f"FEN no corresponde a un Mate")

engine.quit()
print(f"Fin")

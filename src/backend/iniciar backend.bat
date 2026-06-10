@echo off
echo Executando teste...
python scripts/setup_aws_db.py
python -m pip install -r requirements.txt
REM --host 0.0.0.0 faz a API escutar em todas as interfaces de rede,
REM permitindo que celulares (Expo Go) e outros dispositivos da mesma
REM rede acessem em http://IP_DA_MAQUINA:8000 (alem do localhost).
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
echo Servidor em funcionamento
pause

@echo off
echo Executando teste...
python scripts/setup_aws_db.py
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
echo Servidor em funcionamento
pause

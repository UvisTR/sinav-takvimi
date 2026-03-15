from flask import Flask, render_template, jsonify
import pandas as pd

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    # Excel'den gelen Türkçe karakterli CSV'yi okur
    df = pd.read_csv('sinavlar.csv', encoding='utf-8')
    return jsonify(df.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug=True)
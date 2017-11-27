from flask import Flask, render_template, Response
import json
from models import DatabaseModel
import requests

app = Flask(__name__)
app.config.from_envvar('APP_CONFIG_FILE', silent = True)

def dbObject():
	return DatabaseModel(app.config['DB_HOST'], app.config['DB_NAME'], app.config['DB_USER'], app.config['DB_PASSWORD'], app.config['DB_PORT'])

@app.route('/')
@app.route('/index.html')
def index():
	db = dbObject()
	chargingStations = db.getChargingStations()
	return render_template('index.html', access_token = app.config['MAPBOX_ACCESS_TOKEN'], chargingStations = chargingStations)

@app.route('/api/get/all')
def getAll():
	db = dbObject()
	chargingStations = db.getChargingStations()
	return Response(json.dumps(chargingStations),  mimetype='application/json')

@app.route('/api/get/<int:radius>/<lat>/<lng>')
def getInRadius(radius, lat, lng):
	db = dbObject()
	chargingStations = db.getChargingStationsInRadius(lat, lng, radius)
	return Response(json.dumps(chargingStations),  mimetype='application/json')

@app.route('/api/get/amenity/<lat>/<lng>')
def getAmenities(lat, lng):
	db = dbObject()
	amenities = db.getAmenities(lat, lng)
	return Response(json.dumps(amenities),  mimetype='application/json')

@app.route('/api/get/districts')
def getDistricts():
	db = dbObject()
	districts = db.getDistricts()
	return Response(json.dumps(districts),  mimetype='application/json')

@app.route('/api/get/from/<district>')
def getChargingStationsOfDistrict(district):
	db = dbObject()
	chargingStations = db.getChargingStationsOfDistrict(district)
	return Response(json.dumps(chargingStations),  mimetype='application/json')

@app.route('/api/get/boundary/<district>')
def getDistrictsBoundary(district):
	db = dbObject()
	points = db.getDistrictsBoundary(district)
	return Response(json.dumps(points),  mimetype='application/json')

@app.route('/getFromApi')
def getFromApi():
	response = requests.get("https://api.openchargemap.io/v2/poi/?output=json&countrycode=SK&maxresults=150")
	data = json.loads(response.text)
	db = dbObject()
	db.insertDataFromAPI(data)
	return str(response.status_code)

if __name__ == '__main__':
	app.run(debug = True)
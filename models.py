import psycopg2
import sys

class DatabaseModel(object):
	def __init__(self, host, dbname, user, password, port):
		self.__dbname = dbname
		self.__user = user
		self.__host = host
		self.__password = password
		self.__port = port
		self.__connected = False
		self.__connect = None
		self.connectToDB()

	def __del__(self):
		pass

	@property
	def connected(self):
		return self.__connected

	@property
	def connect(self):
		return self.__connect

	def connectToDB(self):
		try:
			connectionString = "dbname=%s user=%s host=%s password=%s port=%s" % (self.__dbname, self.__user, self.__host, self.__password, self.__port)
			self.__connect = psycopg2.connect(connectionString)
			self.__connected = True
		except:
			return

	def getChargingStations(self):
		'''
			Returns GeoJSON of all charging stations
			ARGUMENTS:
				-
		'''
		cur = self.__connect.cursor()
		
		query = '''
		SELECT json_build_object(
			'type', 'Feature',
			'geometry', ST_AsGeoJSON(geom)::json,
			'properties', json_build_object(
				'operator_title', operator_title,
				'operator_url', operator_url,
				'operator_address', operator_address,
				'operator_mail', operator_mail,
				'is_pay_at_location', is_pay_at_location,
				'is_membership_required', is_membership_required,
				'usage_cost', usage_cost,
				'address_title', address_title,
				'address_line1', address_line1,
				'address_line2', address_line2,
				'address_town', address_town,
				'address_postcode', address_postcode,
				'contact_phone', contact_phone,
				'number_of_points', number_of_points,
				'connection_type_title', connection_type_title,
				'connection_type_name', connection_type_name,
				'connection_amps', connection_amps,
				'connection_voltage', connection_voltage,
				'connection_power', connection_power,
				'connection_current_type', connection_current_type,
				'connection_current_desc', connection_current_desc
			)
		)
		FROM charging_stations;
		'''

		cur.execute(query)
		rows = cur.fetchall()
		return rows

	def getChargingStationsInRadius(self, lat, lng, radius):
		'''
			Returns GeoJSON of charging stations which are in selected radius
			ARGUMENTS:
				radius - radius in meters
		'''
		cur = self.__connect.cursor()
		
		query = '''
		SELECT json_build_object(
			'type', 'Feature',
			'geometry', ST_AsGeoJSON(geom)::json,
			'properties', json_build_object(
				'operator_title', operator_title,
				'operator_url', operator_url,
				'operator_address', operator_address,
				'operator_mail', operator_mail,
				'is_pay_at_location', is_pay_at_location,
				'is_membership_required', is_membership_required,
				'usage_cost', usage_cost,
				'address_title', address_title,
				'address_line1', address_line1,
				'address_line2', address_line2,
				'address_town', address_town,
				'address_postcode', address_postcode,
				'contact_phone', contact_phone,
				'number_of_points', number_of_points,
				'connection_type_title', connection_type_title,
				'connection_type_name', connection_type_name,
				'connection_amps', connection_amps,
				'connection_voltage', connection_voltage,
				'connection_power', connection_power,
				'connection_current_type', connection_current_type,
				'connection_current_desc', connection_current_desc
			)
		)
		FROM charging_stations WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(%(lng)s, %(lat)s)::geography, 4326), %(radius)s);
		'''

		agruments_dict = {
			'lat':		lat,
			'lng':		lng,
			'radius':	radius
		}

		cur.execute(query, agruments_dict)
		rows = cur.fetchall()
		return rows

	def getChargingStationsOfDistrict(self, district):
		'''
			Returns GeoJSON of charging stations which belongs to selected district
			ARGUMENTS:
				district - name of district
		'''
		cur = self.__connect.cursor()
		
		query = '''
		SELECT json_build_object(
			'type', 'Feature',
			'geometry', ST_AsGeoJSON(s.geom)::json,
			'properties', json_build_object(
				'operator_title', s.operator_title,
				'operator_url', s.operator_url,
				'operator_address', s.operator_address,
				'operator_mail', s.operator_mail,
				'is_pay_at_location', s.is_pay_at_location,
				'is_membership_required', s.is_membership_required,
				'usage_cost', s.usage_cost,
				'address_title', s.address_title,
				'address_line1', s.address_line1,
				'address_line2', s.address_line2,
				'address_town', s.address_town,
				'address_postcode', s.address_postcode,
				'contact_phone', s.contact_phone,
				'number_of_points', s.number_of_points,
				'connection_type_title', s.connection_type_title,
				'connection_type_name', s.connection_type_name,
				'connection_amps', s.connection_amps,
				'connection_voltage', s.connection_voltage,
				'connection_power', s.connection_power,
				'connection_current_type', s.connection_current_type,
				'connection_current_desc', s.connection_current_desc
			)
		)
		FROM charging_stations s 
		CROSS JOIN hranice_okresy_0 h
		WHERE nm3 LIKE %(district)s
		AND ST_Intersects(s.geom, ST_Transform(h.geom, 4326)::geography);
		'''

		agruments_dict = {
			'district':		district
		}

		cur.execute(query, agruments_dict)
		rows = cur.fetchall()
		return rows

	def getDistricts(self):
		cur = self.__connect.cursor()

		query = '''
		SELECT nm3 FROM hranice_okresy_0 ORDER BY nm3;
		'''

		cur.execute(query)
		rows = cur.fetchall()
		return rows

	def getDistrictsBoundary(self, district):
		'''
			Returns GeoJSON of points that makes a boundary of district
			ARGUMENTS:
				district - name of district
		'''
		cur = self.__connect.cursor()

		query = '''
		SELECT json_build_object(
			'type', 'Feature',
			'geometry', ST_AsGeoJSON(ST_Transform((ST_Dump(geom)).geom, 4326))::json
		)
		FROM hranice_okresy_0
		WHERE nm3 LIKE %(district)s;
		'''

		agruments_dict = {
			'district':		district
		}

		cur.execute(query, agruments_dict)
		rows = cur.fetchall()
		return rows

	def getAmenities(self, lat, lng):
		'''
			Returns GeoJSON of points of interest (amenities) in radius 0.5KM from point
			ARGUMENTS:
				lat - latitude of point
				lng - longitude of point
		'''
		cur = self.__connect.cursor()

		query = '''
		WITH amenities as (
			SELECT way, name, amenity FROM planet_osm_point
			WHERE amenity = 'pub'
			OR amenity = 'bar'
			OR amenity = 'food_court'
			OR amenity = 'restaurant'
			OR amenity = 'cafe'
			OR amenity = 'feeding_place'
			OR amenity = 'fast_food'
		)
		SELECT json_build_object(
			'type', 'Feature',
			'geometry', ST_AsGeoJSON(ST_Transform(way, 4326))::json,
			'properties', json_build_object(
				'name', name,
				'amenity', amenity
			)
		)
		FROM amenities WHERE ST_DWithin(ST_Transform(way, 4326)::geography, ST_SetSRID(ST_MakePoint(%(lng)s, %(lat)s)::geography, 4326), 500);
		'''

		agruments_dict = {
			'lat':		lat,
			'lng':		lng
		}

		cur.execute(query, agruments_dict)
		rows = cur.fetchall()
		return rows

	def insertDataFromAPI(self, data):
		'''
			Inserts data to table charging_stations from openchargemap.org api 
			ARGUMENTS:
				data - json data
		'''
		cur = self.__connect.cursor()
		for item in data:
			if item['OperatorInfo'] is not None:
				tmp_operator_title = item['OperatorInfo']['Title']
				tmp_operator_url = item['OperatorInfo']['WebsiteURL']
				tmp_operator_address = item['OperatorInfo']['AddressInfo']
				tmp_operator_mail = item['OperatorInfo']['ContactEmail']
			else:
				tmp_operator_title = None
				tmp_operator_url = None
				tmp_operator_address = None
				tmp_operator_mail = None

			if item['UsageType'] is not None:
				tmp_is_pay_at_location = item['UsageType']['IsPayAtLocation']
				tmp_is_membership_required = item['UsageType']['IsMembershipRequired']
			else:
				tmp_is_pay_at_location = None
				tmp_is_membership_required = None

			tmp_usage_cost = item['UsageCost']
			
			if item['AddressInfo'] is not None:
				tmp_address_title = item['AddressInfo']['Title']
				tmp_address_line1 = item['AddressInfo']['AddressLine1']
				tmp_address_line2 = item['AddressInfo']['AddressLine2']
				tmp_address_town = item['AddressInfo']['Town']
				tmp_address_postcode = item['AddressInfo']['Postcode']
				tmp_lng = item['AddressInfo']['Longitude']
				tmp_lat = item['AddressInfo']['Latitude']
				tmp_contact_phone = item['AddressInfo']['ContactTelephone1']
			else:
				tmp_address_title = None
				tmp_address_line1 = None
				tmp_address_line2 = None
				tmp_address_town = None
				tmp_address_postcode = None
				tmp_lng = None
				tmp_lat = None
				tmp_contact_phone = None

			tmp_number_of_points = item['NumberOfPoints']
			
			if item['Connections'] is not None:
				tmp_connection_type_title = item['Connections'][0]['ConnectionType']['Title']
				tmp_connection_type_name = item['Connections'][0]['ConnectionType']['FormalName']
				tmp_connection_amps = item['Connections'][0]['Amps']
				tmp_connection_voltage = item['Connections'][0]['Voltage']
				tmp_connection_power = item['Connections'][0]['PowerKW']
				if item['Connections'][0]['CurrentType'] is not None:
					tmp_connection_current_type = item['Connections'][0]['CurrentType']['Title']
					tmp_connection_current_desc = item['Connections'][0]['CurrentType']['Description']
				else:
					tmp_connection_current_type = None
					tmp_connection_current_desc = None
			else:
				tmp_connection_type_title = None
				tmp_connection_type_name = None
				tmp_connection_amps = None
				tmp_connection_voltage = None
				tmp_connection_power = None
				tmp_connection_current_type = None
				tmp_connection_current_desc = None
			
			query = '''
				INSERT INTO charging_stations (
					operator_title,
					operator_url,
					operator_mail,
					is_pay_at_location,
					is_membership_required,
					usage_cost,
					address_title,
					address_line1,
					address_line2,
					address_town,
					address_postcode,
					geom,
					contact_phone,
					number_of_points,
					connection_type_title,
					connection_type_name,
					connection_amps,
					connection_voltage,
					connection_power,
					connection_current_type,
					connection_current_desc
				) VALUES (
					%(operator_title)s,
					%(operator_url)s,
					%(operator_mail)s,
					%(is_pay_at_location)s,
					%(is_membership_required)s,
					%(usage_cost)s,
					%(address_title)s,
					%(address_line1)s,
					%(address_line2)s,
					%(address_town)s,
					%(address_postcode)s,
					ST_SetSRID(ST_MakePoint(%(lng)s, %(lat)s)::geography, 4326),
					%(contact_phone)s,
					%(number_of_points)s,
					%(connection_type_title)s,
					%(connection_type_name)s,
					%(connection_amps)s,
					%(connection_voltage)s,
					%(connection_power)s,
					%(connection_current_type)s,
					%(connection_current_desc)s	
				)'''

			agruments_dict = {
				'operator_title':			tmp_operator_title,
				'operator_url':				tmp_operator_url,
				'operator_mail':			tmp_operator_mail,
				'is_pay_at_location':		tmp_is_pay_at_location,
				'is_membership_required': 	tmp_is_membership_required,
				'usage_cost': 				tmp_usage_cost,
				'address_title': 			tmp_address_title,
				'address_line1': 			tmp_address_line1,
				'address_line2': 			tmp_address_line2,
				'address_town': 			tmp_address_town,
				'address_postcode': 		tmp_address_postcode,
				'lng':						tmp_lng,
				'lat':						tmp_lat,
				'contact_phone': 			tmp_contact_phone,
				'number_of_points': 		tmp_number_of_points,
				'connection_type_title': 	tmp_connection_type_title,
				'connection_type_name': 	tmp_connection_type_name,
				'connection_amps': 			tmp_connection_amps,
				'connection_voltage': 		tmp_connection_voltage,
				'connection_power': 		tmp_connection_power,
				'connection_current_type': 	tmp_connection_current_type,
				'connection_current_desc': 	tmp_connection_current_desc
			}

			try:
				cur.execute(query, agruments_dict)
			except psycopg2.Error as e:
				print(e)

			self.__connect.commit()
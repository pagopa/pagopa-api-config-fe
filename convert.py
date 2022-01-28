import json

with open('swagger.json', 'r') as file:
    param = """{          "description": "This header identifies the call, if not passed it is self-generated. This ID is returned in the response.",          "in": "header",          "name": "X-Request-Id",          "type": "string"        }"""
    response = """"X-Request-Id": {                "description": "This header identifies the call",                "type": "string"              }"""
    data = file.read().replace("\n", "").replace(" ", "")
    data = data.replace(param.replace(" ", ""), "")
    data = data.replace(response.replace(" ", ""), "")
    print(data)

f = open("swagger.json", "w")
mydata = json.loads(data)
f.write(json.dumps(mydata, indent=4))
f.close()

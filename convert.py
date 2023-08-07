import json

with open('swagger.json', 'r') as file:
    param = """{          "description": "This header identifies the call, if not passed it is self-generated. This ID is returned in the response.",          "in": "header",          "name": "X-Request-Id",          "type": "string"        }"""
    request_id_response = """"X-Request-Id": {                "description": "This header identifies the call",                "type": "string"              },"""
    warning_response = """"X-Warning": {                "description": "This header identifies response validation error",                "type": "string"              }"""
    psp_pattern_response = """"pattern": "[A-Z0-9_]{6,14}","""
    payment_type_pattern_response = """"pattern": "[A-Z]*","""
    iban_model_definition_toReplace = """"required": ["iban", "publication_date", "validity_date"],"""
    iban_model_definition_final = """"required": ["iban", "validity_date"],"""

    data = file.read().replace("\n", "").replace(" ", "")
    data = data.replace(param.replace(" ", ""), "")
    data = data.replace(request_id_response.replace(" ", ""), "")
    data = data.replace(warning_response.replace(" ", ""), "")
    data = data.replace(psp_pattern_response.replace(" ", ""), "")
    data = data.replace(payment_type_pattern_response.replace(" ", ""), "")
    data = data.replace(iban_model_definition_toReplace.replace(" ", ""), iban_model_definition_final)
    print(data)

f = open("swagger.json", "w")
mydata = json.loads(data)
f.write(json.dumps(mydata, indent=4))
f.close()

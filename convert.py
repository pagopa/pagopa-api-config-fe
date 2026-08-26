import json

with open('swagger.json', 'r') as file:
    param = """{          "description": "This header identifies the call, if not passed it is self-generated. This ID is returned in the response.",          "in": "header",          "name": "X-Request-Id",          "type": "string"        }"""
    request_id_response = """"X-Request-Id": {                "description": "This header identifies the call",                "type": "string"              },"""
    warning_response = """"X-Warning": {                "description": "This header identifies response validation error",                "type": "string"              }"""
    psp_pattern_response = """"pattern": "[A-Z0-9_]{6,14}","""
    payment_type_pattern_response = """"pattern": "[A-Z]*","""
    data = file.read().replace("\n", "").replace(" ", "")
    data = data.replace(param.replace(" ", ""), "")
    data = data.replace(request_id_response.replace(" ", ""), "")
    data = data.replace(warning_response.replace(" ", ""), "")
    data = data.replace(psp_pattern_response.replace(" ", ""), "")
    data = data.replace(payment_type_pattern_response.replace(" ", ""), "")
    print(data)

f = open("swagger.json", "w")
mydata = json.loads(data)

# Frontend-only patch: lo schema `Iban` usato da GET
# /creditorinstitutions/{code}/ibans non espone i campi data che la UI
# renderizza come oggetti Date (esistono solo su IbanEnhanced). Senza di essi il
# client io-ts lascia i valori come stringhe grezze e
# `validity_date.toLocaleDateString()` va in errore. Li iniettiamo qui come
# date-time cosi' il codec generato li decodifica via UTCISODateFromString.
# Rimuovere quando il contratto backend esporra' questi campi su Iban.
iban_schema = mydata.get("definitions", {}).get("Iban")
if iban_schema is not None:
    iban_props = iban_schema.setdefault("properties", {})
    for date_field in ("validity_date", "publication_date"):
        iban_props.setdefault(date_field, {"type": "string", "format": "date-time"})

f.write(json.dumps(mydata, indent=4))
f.close()
# Microservice > Preview

Extracted microservice from https://github.com/chrisparnin/checkbox.io.

### Service

1. Exposes the endpoint `GET localhost:3000/survey/{filename}` returns html body (viewable in browser).

2. Exposes the endpoint `POST localhost:3000/json`, accepting a body with `{markdown: <string>}`.

Returns the result `{preview: <html>}`.

### Testing locally

Start service.
```bash
node index.js
Microservice listening on http://localhost:3000/{survey,json}
```

```bash
curl -X POST -H "Content-Type: application/json" --data @test/resources/survey.json http://localhost:3000/json
```



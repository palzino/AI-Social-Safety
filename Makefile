make build-64:
	docker build --platform linux/amd64 --no-cache -t gitea.palvir.dev/gitea/ai-social .
make push:
	docker push gitea.palvir.dev/gitea/ai-social

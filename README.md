<p align="center">
  <img src="https://raw.githubusercontent.com/skylab-kulubu/ytuguessr/41604261a281125e27ef43f2e8385924efe1e1a4/logo.svg" width="200" />
</p>

Bu projeyi çalıştırmak için önce `.env.example` dosyasını `.env` olarak kopyalayıp değerleri doldurun, sonra `docker-compose up --build` komudunu kullanınız.

Yayın: `backend` dalına her push `ghcr.io/skylab-kulubu/ytuguessr-backend:latest` imajını üretir (canlıya dokunmaz). Canlıya çıkmak için `backend`'den `backend-production`'a PR açılır; birleşince `:production` imajı üretilir ve Dokploy deploy edilir.

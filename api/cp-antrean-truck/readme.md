- api dibuat menggunakan online editor plansys
- api terdapat pada builder/model builder
- ini adalah api yang nantinya akan saya gunakan
- saya akan memberikan gambar tabel yang dikenai pekerjaan

```
url: https://hachi.kamz-kun.id/cp_fifo/index.php?r-Api
body: {  
    "function": "",
    "mode": "function",
    "model": "MLocation",
    "params": {},
    "token": "dctfvgybefvgyabdfhwuvjlnsd",
    "user_token": "dNS1f.f4HKgIXqH9GDs9F150nhSbK"
}
```

- jadi semua api menggunakan url yang sama, yang membedakan adalah pada dari model mana dia diambil dan function apa yang dipakai


output yang saya harapkan :
1. buatkan 2 function pada model MLocation yang nantinya akan saya gunakan pada pages edit warehouse layout 
2. dimana function yang pertama berfungsi sebagai GET data location / storageUnit
3. function kedua untuk melakukan POST storageUnit
4. transform dilakukan di level data (yang berarti transform / logic akan dilakukan pada tiap function)
5. dimana pada function pertama GET, data sudah harus di transform seperti pada mock-data.json (/Users/hafidhahmadfauzan/project/CP-Antrean-Truck/src/data/mock-data.json)
6, sedangkan pada function kedua, data yang di kirim pada api POST seperti pada mock-data.json (/Users/hafidhahmadfauzan/project/CP-Antrean-Truck/src/data/mock-data.json) lalu harus diberikan logic untuk check apakah id pada storageUnit cocok dengan table m_location, jika table cocok maka edit data, jika belum ada maka buat baru


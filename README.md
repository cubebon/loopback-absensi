# API Absensi Pegawai

API Absensi Pegawai adalah sebuah RESTful API yang dibangun menggunakan framework Loopback 3 dan database MongoDB. API ini dapat digunakan untuk melakukan absensi hadir, cuti, izin, dan sakit pegawai. Selain itu, API ini juga menyediakan laporan absensi pegawai berupa jumlah telat, tidak masuk, cuti, dan izin yang disetujui atau ditolak

# Instalasi
Untuk menjalankan API ini secara lokal, lakukan langkah-langkah berikut:
1. Clone repository ini ke direktori lokal:

    ```git clone https://github.com/cubebon/loopback-absensi.git```
    
2. Masuk ke direktori repo:

    ```cd loopback-absensi```
    
3. Install dependencies:

    ```npm install```

4. Jalankan MongoDB di localhost:

    ```mongod```
 
5. Jalankan API:

    ```node .```
    

# Penggunaan
Setelah berhasil menjalankan API, dapat dilakukan pengujian dengan menggunakan Postman atau aplikasi serupa. Berikut adalah beberapa contoh penggunaan API ini:
## 1. Melakukan absensi hadir
Endpoint: ```POST api/Attendances```

Request body:
```
{
  "employeeId": "640ade24d68ada76168616f5",
  "type": "hadir",
}
```
Response:
```
{
  "date": "2023-03-10T10:08:04.449Z",
  "type": "hadir",
  "status": "oke",
  "id": "640b01841d934f69a49830f0",
  "employeeId": "640ade24d68ada76168616f5"
}
```

## 2. Melakukan absensi cuti
Endpoint: ```POST api/Attendances```

Request body:
```
{
  "type": "cuti",
  "reason": "Cuti urusan mendadak",
  "employeeId": "640ade24d68ada76168616f5"
}
```
Response:
```
{
  "date": "2023-03-10T10:12:12.625Z",
  "type": "cuti",
  "status": "pending",
  "reason": "Cuti urusan mendadak",
  "id": "640b027cbb018b3eccbde5c6",
  "employeeId": "640ade24d68ada76168616f5"
}
```

## 3. Menyetujui absensi cuti
Endpoint: ```POST api/Attendances/:id/approve```

Request url:
```
http://localhost:3000/api/Attendances/640b027cbb018b3eccbde5c6/approve
```
Response:
```
{
  "date": "2023-03-10T10:12:12.625Z",
  "type": "cuti",
  "status": "approved",
  "reason": "Cuti urusan mendadak",
  "id": "640b027cbb018b3eccbde5c6",
  "employeeId": "640ade24d68ada76168616f5"
}
```

## 4. Menolak absensi cuti
Endpoint: ```POST api/Attendances/:id/reject```

Request url:
```
http://localhost:3000/api/Attendances/640b027cbb018b3eccbde5c6/approve
```
Response:
```
{
  "date": "2023-03-10T10:12:12.625Z",
  "type": "cuti",
  "status": "rejected",
  "reason": "Cuti urusan mendadak",
  "id": "640b027cbb018b3eccbde5c6",
  "employeeId": "640ade24d68ada76168616f5"
}
```

## 5. Melihat laporan absensi hadir, cuti, izin, sakit, approve cuti/izin, reject cuti/izin
Endpoint: ```GET api/Attendances/:employeeId/report```

Parameter:
```
id : 640ade24d68ada76168616f5
month : 2023-03-01
```

Response:
```
{
  "employeeId": "640ade24d68ada76168616f5",
  "month": "2023-03-01T00:00:00.000Z",
  "hadir": 2,
  "sakit": 0,
  "approvedIzinCutiCount": 1,
  "rejectedIzinCutiCount": 2
}
```

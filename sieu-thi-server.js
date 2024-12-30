// đây là sieu-thi-server

const express = require('express');           //phải mượn Express
const sieuThiRoutes = express.Router();     //tạo Router để nhận tất cả câu hỏi
const bcrypt = require("bcrypt")              // mượn để làm mật khẩu an toàn hơn
const app = express();
app.use(express.json())

var cors = require('cors');
app.use(cors());

app.use('/', sieuThiRoutes);		        //bảo Router chỉ nhận câu hỏi bắt đầu ‘/hanhDong

const PORT = 5600;

require('dotenv').config()
console.log('process.env MYSQL_DIACHI: ', process.env.MYSQL_DIACHI)
console.log('process.env MYSQL_USER:', process.env.MYSQL_USER)
console.log('process.env MYSQL_PASS:', process.env.MYSQL_PASS)
console.log('process.env MYSQL_TEN_DATABASE:', process.env.MYSQL_TEN_DATABASE)
console.log('process.argv: ', process.argv)

app.listen(PORT, function() {		          //chạy Web Server ở địa chỉ phòng này
  console.log("Đã bắt đầu server của siêu thị đang đợi câu hỏi và ở phòng Port: " + PORT);
});

const mysql = require('mysql2');

// if(process.argv.length < 3){
//   console.log("Phải viết đầy đủ: Database nào và địa chỉ Database")
//   process.exit()
// }

var tenUserDatabase = process.env.MYSQL_USER
var matkhauDatabase = process.env.MYSQL_PASS
var diaChiDatabase = process.env.MYSQL_DIACHI
var tenDatabase = process.env.MYSQL_TEN_DATABASE

const connection = mysql.createConnection({
  host: diaChiDatabase,
  user: tenUserDatabase,
  password: matkhauDatabase,
  database: tenDatabase
});

// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'dimaduc',
//   database: 'sieuthi'
// });

connection.connect(err => {
  var homNay = new Date();
  var thoiGian = homNay.getHours() + ":" + homNay.getMinutes() + ":" + homNay.getSeconds();
  if(err) {
    console.error('Server không nói chuyện với SQL được. Không tìm thấy mysql do sai địa chỉ máy: '+ 'localhost' +' ['+thoiGian+']');
    return;
  }
  console.log('Server đã kết nối MySQL được ['+thoiGian+']');
});

sieuThiRoutes.route('/SignIn').post(async function(req, res) {
  var thongTinSignIn = req.body
  console.log('SignIn user: ', thongTinSignIn.username)
  console.log('SignIn pass: ', thongTinSignIn.password)
  
  

  try {
    var [ketQuaName] = await connection.promise().query(
      `SELECT *
      FROM sieuthi.taikhoan
      where username = '`+thongTinSignIn.username+`';`
    )
    console.log('ketQuaName: ', ketQuaName) // tìm tên trong tài khoản

    if(ketQuaName.length===0){
      console.log('Lỗi: Chưa có tên ', thongTinSignIn.username, {cause: 401})
      throw new Error('Lỗi: Chưa có tên ', thongTinSignIn.username, {cause: 401})
    }else{
      var soSanhPass = await bcrypt.compare(String(thongTinSignIn.password), ketQuaName[0].password)
      if(
        soSanhPass===true
        // thongTinSignIn.password === ketQuaName[0].password
      ){
        res.json(ketQuaName);
      }else{
        console.log('Lỗi: Sai Password', {cause: 401})
        throw new Error('Lỗi: Sai Password', {cause: 401})
      }
    }
  }
  catch(err){
    console.log('Server không nói chuyện được với Databas: ', err)
    // throw new Error('Server không nói chuyện được với Databas', {cause: 503})
    res
      .status(err.cause)
      .send({thongBao: err.message})
  }
})
sieuThiRoutes.route('/SignUp').post(async function(req, res) {
  var thongTinSignUp = req.body
  console.log('SignUp user: ', thongTinSignUp.username)
  console.log('SignUp pass: ', thongTinSignUp.password)

  try {
    var [ketQuaKT] = await connection.promise().query(
      `SELECT taikhoan.id as idTK, username, password
      FROM sieuthi.taikhoan
      where username = '`+thongTinSignUp.username+`';`
    )

    var passDaMaHoa = await bcrypt.hash(thongTinSignUp.password,10);
    if(ketQuaKT.length===0){
      var [ketQua] = await connection.promise().query(
        `INSERT INTO sieuthi.taikhoan (username, password, nhom) 
        VALUES  ('`+thongTinSignUp.username+`', '`+passDaMaHoa+`', `+thongTinSignUp.nhom+`)`
      )
      console.log('ketQua: ', ketQua)
      console.log('Tạo tài khoản thành công rồi, xin mời Đăng Nhập / Sign In.')
      res.json('Tạo tài khoản thành công rồi, xin mời Đăng Nhập / Sign In.');
    }else{
      console.log('Lỗi: Username này có người khác dùng rồi, xin chọn tên khác.')
      // res.json('Lỗi: Username này có người khác dùng rồi, xin chọn tên khác.');
      throw new Error('Lỗi: Username này có người khác dùng rồi, xin chọn tên khác.', {cause: 401})
    }
  }
  catch(err) {
    console.log('ABC: ', err)
    res
      .status(err.cause)
      .send({thongBao: err.message})
  }
})

sieuThiRoutes.route('/SuaAnh').put(async function(req, res) {
  var suaAnh = req.body
  await connection.promise().query(`UPDATE taikhoan SET anh='`+suaAnh.tenAnh+`' WHERE id = `+suaAnh.id+`;`)
  res.send(suaAnh.tenAnh)
})

sieuThiRoutes.route('/chaoHoi').post(async function(req, res) {
  var homNay = new Date();
  var thoiGian = homNay.getHours() + ":" + homNay.getMinutes() + ":" + homNay.getSeconds();
  var guiChaoHoi1 = req.query.guiChaoHoi
  console.log('guiChaoHoi1: ', guiChaoHoi1)
  var guiChaoHoi2 = req.body.LoaiCa
  var guiChaoHoi3 = req.body.LoaiThit
  var guiChaoHoi4 = req.body.LoaiRau
  console.log(guiChaoHoi2 + ' & ' + guiChaoHoi3 + ' & ' + guiChaoHoi4)
  
  // connection.query(`INSERT INTO sieuthi.vidu (ten, diaChi) VALUES ('`+guiChaoHoi4+`', '`+thoiGian+`')`)
  // connection.query(`DELETE FROM sieuthi.vidu WHERE id = 1;`)
  connection.query(`UPDATE sieuthi.vidu SET diaChi = '` + thoiGian + `' WHERE id = 2;`)
  
  connection.query('SELECT * FROM sieuthi.vidu', (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Error executing query');
      return;
    }
    console.log('results: ', results)
    res.send(results)
  })
  // res.send('Ai đó')
})


sieuThiRoutes.route('/SanPhamVidu').get(async function(req, res) {
  var tenThucAn = req.query.tenThucAn
  console.log("tenThucAn: ", tenThucAn)
  res.send(tenThucAn)
  return
})

sieuThiRoutes.route('/SanPham').get(async function(req, res) {
  connection.query('SELECT * FROM sieuthi.sanpham', (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Error executing query');
      return;
    }
    console.log('results: ', results)
    res.send(results)
  })
  var DanhSachSanPham = req.query.DanhSachSanPham
  console.log('DanhSachSanPham: ', DanhSachSanPham)
  // res.send(DanhSachSanPham)
})

sieuThiRoutes.route('/thanhToan').post(async function(req, res) {
  idUser = req.query.idUser
  console.log('idUser: ', idUser)
  // console.log('danhSachGioHang: ', req.body)
  var khoBanDau = []
  
  try {
    const [rows, fields] = await connection.promise().query('SELECT * FROM sieuthi.sanpham');
    // console.log('Kho bây giờ: ', rows);
    khoBanDau = rows
  }
  catch (error) {
    console.error('Error executing query:', error);
  }
  
  var danhSachGioHang = req.body
  // for(var i=0; i<danhSachGioHang.length; i++){
  //   connection.query(`UPDATE sieuthi.sanpham
  //     SET SoLuongTrongKho = '` + (danhSachGioHang[i].SoLuongTrongKho - danhSachGioHang[i].soLuongTrongGio) + `'
  //     WHERE id = `+danhSachGioHang[i].id+`;`
  //   )
  // }

  var doDaiDieuKien = ''
  var doDaiDieuKienID = ''
  var muaDuocKhong = false
  var viTri = ''
  
  console.log('danhSachGioHang', danhSachGioHang)
  console.log('khoBanDau', khoBanDau)


  for(var i=0; i<danhSachGioHang.length; i++){
    for(var j=0; j<khoBanDau.length; j++){
      //có vấn đề x
      // Nấu lấy sữa trước thì trong danhSachGioHang có sữa trước và khoBanDau vẫn thịt trước

      if(danhSachGioHang[i].id === khoBanDau[j].id){
      
        danhSachGioHang[i].SoLuongTrongKho = khoBanDau[j].SoLuongTrongKho

        doDaiDieuKien += `\n WHEN id=`+danhSachGioHang[i].id+` THEN `+(danhSachGioHang[i].SoLuongTrongKho - danhSachGioHang[i].soLuongTrongGio)
        doDaiDieuKienID += danhSachGioHang[i].id+', '

        console.log('SoLuongTrongKho', danhSachGioHang[i].SoLuongTrongKho)
        console.log('soLuongTrongGio', danhSachGioHang[i].soLuongTrongGio)

        if(danhSachGioHang[i].SoLuongTrongKho - danhSachGioHang[i].soLuongTrongGio < 0){
          console.log('Trong kho không đủ, chỉ còn lại', danhSachGioHang[i].SoLuongTrongKho + ' ' + danhSachGioHang[i].Ten)
          muaDuocKhong = false
          viTri = i
        }else if(danhSachGioHang[i].SoLuongTrongKho - danhSachGioHang[i].soLuongTrongGio === 0){
          console.log('Đã mua hết hàng')
          muaDuocKhong = true
        }else if(danhSachGioHang[i].SoLuongTrongKho - danhSachGioHang[i].soLuongTrongGio > 0){
          console.log('Đã mua hàng')
          muaDuocKhong = true
        }
        break
      }
    }
  }
  doDaiDieuKien+= ` \n WHEN id=`+danhSachGioHang[danhSachGioHang.length-1].id+` THEN `+(danhSachGioHang[danhSachGioHang.length-1].SoLuongTrongKho - danhSachGioHang[danhSachGioHang.length-1].soLuongTrongGio)
  doDaiDieuKienID += danhSachGioHang[danhSachGioHang.length-1].id

  console.log('doDaiDieuKien: ', doDaiDieuKien)
  console.log('doDaiDieuKienID: ', doDaiDieuKienID)

  console.log('muaDuocKhong: ', muaDuocKhong)
  if(muaDuocKhong === false){
    console.log('viTri: ', viTri)
    var thongBaoLoi = {
      id: danhSachGioHang[viTri].id,
      soLuongConLai: danhSachGioHang[viTri].SoLuongTrongKho,
      thongBao: 'Trong kho không đủ, chỉ còn lại ' + danhSachGioHang[viTri].SoLuongTrongKho + ' ' + danhSachGioHang[viTri].Ten
    }
    res.status(503).send(thongBaoLoi)
    // console.log('thongBaoLoi: ', muaDuocKhong)
  }else if(muaDuocKhong === true){
    // console.log('thongBaoThanhCong: ', muaDuocKhong)

    const insertQuery = `INSERT INTO sieuthi.donhang (IdNguoiMua, IdSanPham, NgayThang) VALUES (`+idUser+`, 2, '2024-12-29 15:00:00');`
    
    const updateQuery = `UPDATE sieuthi.sanpham SET SoLuongTrongKho = CASE `+doDaiDieuKien+` ELSE SoLuongTrongKho END WHERE id IN (`+doDaiDieuKienID+`);`
      
    connection.query(insertQuery, (err, ketQua) => {
      
      if(err) {
        console.error('Lỗi khi thực hiện query INSERT INTO:', err);
        res.status(503).send('Lỗi khi thực hiện query INSERT INTO');
        return
      }

      console.log(ketQua)

      connection.query(updateQuery, (err, ketQua) => {
        if (err) {
          console.error('Lỗi khi thực hiện query UPDATE:', err);
          res.status(503).send('Lỗi khi thực hiện query UPDATE');
          return
        }
        console.log(ketQua)
        // console.log('idUser ', idUser)
        res.send('Đã mua hàng.')
      });
    })
    // res.send('Đã mua hàng.')
  }
})

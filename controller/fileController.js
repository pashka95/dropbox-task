import uuid from 'uuid';
import dropbox from '../dropbox/dropbox';
import dbDriver from '../drivers/dbDriver';
import mongoose from 'mongoose';
import config from 'config';
import fs from 'fs';
import path from 'path';

let file = new dbDriver('fileSchema');

class FileController {

	createFile(arg) {

		return new Promise((resolve, reject) => {

			let info = this.parcePath(arg.path);

			let folder = info.folder;
			let name = info.name;
			let ext = info.ext;

			let id = `${uuid.v1()}.${ext}`;
			
			arg.path = `${folder}/${id}`;

			let dataFile;

			dropbox.upload(arg)
				.then((data) => {
					
					dataFile = data;
					return this.addToDB({ name, uuid: id });
					
				})
				.then(() => {
					
					resolve({ file: dataFile, customName: name });
					
				})
				.catch((error) => {
					
					reject(error);
					
				});
			
		});
        
	}

	listFolder(arg) {

		return new Promise((resolve, reject) => {

			dropbox.listFolder(arg)
				.then((data) => {

					let promises = this.setFindOnePromises(data.entries);

					return Promise.all(promises);

				})
				.then((data) => {

					resolve(this.setList(data));

				})
				.catch((error) => {
					
					reject(error);
					
				});

		});

	}

	downloadFile(arg) {

		return new Promise((resolve, reject) => {

			let dataFile;

			dropbox.download(arg)
				.then((data) => {

					dataFile = data;
					return this.findOne({ uuid: data.name });

				})
				.then((data) => {

					resolve({ file: dataFile, customName: data.name || dataFile.name });

				})
				.catch((error) => {

					reject(error);

				});

		});

	}

	downloadPDFAndSave(arg) {

		return new Promise((resolve, reject) => {
			
			this.download(arg)
				.then((data) => {

					fs.writeFile(path.join(__dirname, './work begin2.pdf'), data.file.fileBinary, 'binary', (err, data) => {

						err ? reject(err) : resolve();

					});
					
				})
				.catch((error) => {
					
					reject(error);
					
				});
			
		});

	}

	updateFile(arg) {

		return new Promise((resolve, reject) => {

			let dataFile;

			dropbox.update(arg)
				.then((data) => {

					dataFile = data;
					return this.findOne({ uuid: data.name });

				})
				.then((data) => {

					resolve({ file: dataFile, customName: data.name || dataFile.name });

				})
				.catch((error) => {

					reject(error);

				});

		});

	}

	deleteFile(arg) {

		return new Promise((resolve, reject) => {

			let dataFile;

			dropbox.remove(arg)
				.then((data) => {

					dataFile = data;
					return this.deleteFromDB({ uuid: data.name });

				})
				.then((data) => {

					resolve({ file: dataFile, customName: data.name || dataFile.name });

				})
				.catch((error) => {

					reject(error);

				});

		});

	}

	parcePath(path) {

		let info = {};

		let arr = path.split('/');

		info.name = arr[arr.length - 1];

		arr.splice(arr.length - 1, 1);

		info.folder = arr.join('/');

		arr = info.name.split('.');

		info.ext = (arr.length !== 1) ? arr[arr.length - 1] : '';

		return info;

	}
	
	addToDB(data) {
		
		return file.create(data);
		
	}
	
	findOne(criteria) {
		
		return file.findOne(criteria);
		
	}

	deleteFromDB(criteria) {

		return file.deleteOne(criteria);

	}

	setFindOnePromises(files) {

		let promises = [];
		let p;

		files.forEach((item) => {

			p = new Promise((resolve, reject) => {

				this.findOne({ uuid: item.name })
					.then((data) => {

						resolve({ dropboxFile: item, dbFile: data });

					})
					.catch((error) => {

						reject(error);

					});

			});

			promises.push(p);

		});

		return promises;

	}
	
	setList(data) {
		
		let list = [];
		
		data.forEach((item) => {
			
			let elem = {};

			elem.file = item.dropboxFile;

			elem.customName = item.dbFile ? item.dbFile.name : item.dropboxFile.name;
			
			list.push(elem);
			
		});
		
		return list;
		
	}

	createSharedLink(arg) {

		return new Promise((resolve, reject) => {

			dropbox.createSharedLink(arg)
				.then((data) => {

					resolve(data);

				})
				.catch((error) => {

					reject(error);

				});

		});

	}

	createFileLink(arg) {

		return new Promise((resolve, reject) => {

			this.createSharedLink(arg)
				.then((data) => {

					data.url = `${data.url.slice(0,-1)}1`;
					resolve(data);

				})
				.catch((error) => {

					reject(error);

				});

		});

	}

	createFolder(arg) {

		return dropbox.createFolder(arg);

	}

	deleteFolder(arg) {

		return dropbox.remove(arg);

	}

	move(arg) {

		return new Promise((resolve, reject) => {

			let dataFile;

			dropbox.move(arg)
				.then((data) => {

					dataFile = data;
					return this.findOne({ uuid: data.name });

				})
				.then((data) => {

					resolve({ file: dataFile, customName: data.name || dataFile.name });

				})
				.catch((error) => {

					reject(error);

				});

		});

	}

}

export default new FileController();

let contr = new FileController();

// mongoose.connect(config.DATABASE, (error) => {
//
// 	if (error) {
//
// 		console.log(`Error: ${error}`);
//
// 	} else {
//
// 		// console.log('//        Connected to API db        //');
// 		// contr.createFile({ path: '/test/test.txt', contents: 'Hello, world' })
// 		// 	.then((data) => {
//         //
// 		// 		console.log(data);
//         //
// 		// 	})
// 		// 	.catch((err) => {
//         //
// 		// 		console.log(err);
//         //
// 		// 	});
//
// 		// contr.listFolder({ path: '/test' })
// 		// 	.then((data) => {
//         //
// 		// 		console.log(data);
//         //
// 		// 	})
// 		// 	.catch((err) => {
//         //
// 		// 		console.log(err);
//         //
// 		// 	});
//
// 		// contr.downloadFile({ path: '/test/9cb6a360-80e5-11e6-a15f-5fb98c9538ae.txt' })
// 		// 	.then((data) => {
//         //
// 		// 		console.log(data);
//         //
// 		// 	})
// 		// 	.catch((err) => {
//         //
// 		// 		console.log(err);
//         //
// 		// 	});
//
// 		// contr.updateFile({ path: '/test/c0465740-80da-11e6-aa21-c921a4202b57.txt', contents: 'Hello, world! I update you' })
// 		// 	.then((data) => {
//         //
// 		// 		console.log(data);
//         //
// 		// 	})
// 		// 	.catch((err) => {
//         //
// 		// 		console.log(err);
//         //
// 		// 	});
//
// 		// contr.deleteFile({ path: '/test/c0465740-80da-11e6-aa21-c921a4202b57.txt' })
// 		// 	.then((data) => {
//         //
// 		// 		console.log(data);
//         //
// 		// 	})
// 		// 	.catch((err) => {
//         //
// 		// 		console.log(err);
//         //
// 		// 	});
//
// 		// fs.readFile(path.join(__dirname, './picture.jpeg'), 'utf8', (err, contents) => {
//         //
// 		// 	if (err) {
//         //
// 		// 		console.log(err);
//         //
// 		// 	}
//         //
// 		// 	contr.createFile({ path: '/test/picture.jpeg', contents })
// 		// 		.then((data) => {
//         //
// 		// 			console.log(data);
//         //
// 		// 		})
// 		// 		.catch((err) => {
//         //
// 		// 			console.log(err);
//         //
// 		// 		});
//         //
// 		// });
//
// 	}
//
// });

# TodoDB 생성
DROP DATABASE IF EXISTS TodoDB;
CREATE DATABASE TodoDB;
USE TodoDB;

# todo 테이블 생성
CREATE TABLE todo (
    id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    reg_date DATETIME NOT NULL,
    update_date DATETIME NOT NULL,
    user_code CHAR(50) NOT NULL,    
    `no` INT UNSIGNED NOT NULL,
    perform_date DATETIME NOT NULL,
    content VARCHAR(200) NOT NULL,
    is_completed TINYINT UNSIGNED NOT NULL DEFAULT 0
);

SELECT * FROM todo;

# user_code와 no의 조합에 대해서 unique 설정
# usercode b가 같은 no번호면 안됨. 따라서 유니크를 줌.
ALTER TABLE todo ADD UNIQUE INDEX(`user_code`, `no`);

# 테스트용 데이터 생성
INSERT INTO todo
SET reg_date = NOW(),
update_date = NOW(),
user_code = 'localhost',
`no` = 1,
perform_date = NOW(),
content = '기상';

INSERT INTO todo
SET reg_date = NOW(),
update_date = NOW(),
user_code = 'localhost',
`no` = 2,
perform_date = NOW(),
content = '조깅';

INSERT INTO todo
SET reg_date = NOW(),
update_date = NOW(),
user_code = 'localhost',
`no` = 3, #사용자 3번에 대해서
perform_date = NOW(),
content = '식사';
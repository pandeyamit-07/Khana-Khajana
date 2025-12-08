create database if not exists khanakhajana;
use khanakhajana;

create table user(
    user_id BigInt primary key auto_increment,
    username varchar(255) not null,
    password varchar(255) not null
);

create table orders(
    order_id BigInt primary key,
    timestamp datetime ,
    order_type enum('dine-in', 'delivery', 'pick-up'),
    order_status enum('pending', 'complete'),
    payment_type enum('cash', 'card', 'upi'),
    note varchar(255),
    address varchar(255),
    table_num BigInt,
    mobile_num varchar(10),
    customer_name varchar(255),
    from_counter boolean,
    total BigInt
);

create table inventory(
    item_id BigInt primary key auto_increment,
    item_name varchar(255) not null,
    image_url varchar(255),
    description varchar(255),
    category ENUM('Refreshments', 'Frankie', 'Pizza', 'Sandwich', 'Burgers', 'Fries', 'Pavbhaji', 'Breakfast', 'Noodles') NOT NULL,
    quantity BigInt,
    price BigInt
);
    
create table order_item(
    order_id BigInt,
    item_id BigInt,
    count BigInt,
    foreign key (order_id) references orders(order_id),
    foreign key (item_id) references inventory(item_id)
);
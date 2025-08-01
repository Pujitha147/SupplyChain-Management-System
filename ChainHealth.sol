
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ChainHealth {
    address public admin;
    
    struct Medicine {
        string id;
        string name;
        string category;
        string batchNo;
        uint256 quantity;
        uint256 expiryDate;
        string description;
        string imageURL;
        Status status;
        address manufacturer;
        bool isRegistered;
    }
    
    enum Status { Manufactured, Shipped, Delivered, Verified, Counterfeit }
    
    struct Transfer {
        address from;
        address to;
        uint256 quantity;
        uint256 price;
        uint256 timestamp;
        string role; // manufacturer, distributor, retailer, customer
    }
    
    mapping(string => Medicine) public medicines;
    mapping(address => bool) public isManufacturer;
    mapping(address => bool) public isDistributor;
    mapping(address => bool) public isRetailer;
    mapping(string => Transfer[]) public medicineTransfers;
    
    string[] public medicineIds;
    
    event MedicineRegistered(string medicineId, address manufacturer);
    event StatusUpdated(string medicineId, Status status);
    event CounterfeitReported(string medicineId, string reason);
    event ManufacturerAdded(address manufacturer);
    event OwnershipTransferred(address indexed previousAdmin, address indexed newAdmin);
    event MedicineTransferred(string medicineId, address from, address to, uint256 quantity, uint256 price);
    event DistributorAdded(address distributor);
    event RetailerAdded(address retailer);
    
    constructor() {
        admin = msg.sender;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    modifier onlyManufacturer() {
        require(isManufacturer[msg.sender] || msg.sender == admin, "Only manufacturer can call this function");
        _;
    }
    
    modifier onlyDistributor() {
        require(isDistributor[msg.sender] || msg.sender == admin, "Only distributor can call this function");
        _;
    }
    
    modifier onlyRetailer() {
        require(isRetailer[msg.sender] || msg.sender == admin, "Only retailer can call this function");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            msg.sender == admin || 
            isManufacturer[msg.sender] || 
            isDistributor[msg.sender] || 
            isRetailer[msg.sender], 
            "Not authorized"
        );
        _;
    }
    
    function addManufacturer(address _manufacturer) public onlyAdmin {
        isManufacturer[_manufacturer] = true;
        emit ManufacturerAdded(_manufacturer);
    }
    
    function addDistributor(address _distributor) public onlyAdmin {
        isDistributor[_distributor] = true;
        emit DistributorAdded(_distributor);
    }
    
    function addRetailer(address _retailer) public onlyAdmin {
        isRetailer[_retailer] = true;
        emit RetailerAdded(_retailer);
    }
    
    function registerMedicine(
        string memory _id,
        string memory _name,
        string memory _category,
        string memory _batchNo,
        uint256 _quantity,
        uint256 _expiryDate,
        string memory _description,
        string memory _imageURL
    ) public onlyManufacturer {
        require(!medicines[_id].isRegistered, "Medicine with this ID already exists");
        
        medicines[_id] = Medicine({
            id: _id,
            name: _name,
            category: _category,
            batchNo: _batchNo,
            quantity: _quantity,
            expiryDate: _expiryDate,
            description: _description,
            imageURL: _imageURL,
            status: Status.Manufactured,
            manufacturer: msg.sender,
            isRegistered: true
        });
        
        medicineIds.push(_id);
        
        // Record initial "transfer" (creation)
        Transfer memory initialTransfer = Transfer({
            from: address(0), // No sender for initial creation
            to: msg.sender,   // Manufacturer
            quantity: _quantity,
            price: 0,         // No price for initial creation
            timestamp: block.timestamp,
            role: "Manufacturer"
        });
        
        medicineTransfers[_id].push(initialTransfer);
        
        emit MedicineRegistered(_id, msg.sender);
    }
    
    function transferMedicine(
        string memory _id, 
        address _to, 
        uint256 _quantity, 
        uint256 _price,
        string memory _recipientRole
    ) public onlyAuthorized {
        require(medicines[_id].isRegistered, "Medicine not registered");
        require(_quantity > 0, "Quantity must be greater than 0");
        
        // Check if sender has the medicine (manufacturer or in the transfer history)
        bool isOwner = false;
        
        if (medicines[_id].manufacturer == msg.sender) {
            isOwner = true;
        } else {
            Transfer[] memory transfers = medicineTransfers[_id];
            for (uint i = 0; i < transfers.length; i++) {
                if (transfers[i].to == msg.sender) {
                    isOwner = true;
                    break;
                }
            }
        }
        
        require(isOwner, "You don't own this medicine");
        
        // Create transfer record
        Transfer memory newTransfer = Transfer({
            from: msg.sender,
            to: _to,
            quantity: _quantity,
            price: _price,
            timestamp: block.timestamp,
            role: _recipientRole
        });
        
        medicineTransfers[_id].push(newTransfer);
        
        // Update medicine status based on recipient role
        if (keccak256(abi.encodePacked(_recipientRole)) == keccak256(abi.encodePacked("Distributor"))) {
            medicines[_id].status = Status.Shipped;
        } else if (keccak256(abi.encodePacked(_recipientRole)) == keccak256(abi.encodePacked("Retailer"))) {
            medicines[_id].status = Status.Delivered;
        } else if (keccak256(abi.encodePacked(_recipientRole)) == keccak256(abi.encodePacked("Customer"))) {
            medicines[_id].status = Status.Verified;
        }
        
        emit MedicineTransferred(_id, msg.sender, _to, _quantity, _price);
    }
    
    function updateStatus(string memory _id, Status _status) public {
        require(medicines[_id].isRegistered, "Medicine not registered");
        require(
            msg.sender == admin || 
            msg.sender == medicines[_id].manufacturer || 
            isManufacturer[msg.sender] || 
            isDistributor[msg.sender] ||
            isRetailer[msg.sender], 
            "Unauthorized"
        );
        
        medicines[_id].status = _status;
        emit StatusUpdated(_id, _status);
    }
    
    function reportCounterfeit(string memory _id, string memory _reason) public {
        require(medicines[_id].isRegistered, "Medicine not registered");
        
        medicines[_id].status = Status.Counterfeit;
        emit CounterfeitReported(_id, _reason);
    }
    
    function getMedicine(string memory _id) public view returns (
        string memory id,
        string memory name,
        string memory category,
        string memory batchNo,
        uint256 quantity,
        uint256 expiryDate,
        string memory description,
        string memory imageURL,
        Status status,
        address manufacturer
    ) {
        require(medicines[_id].isRegistered, "Medicine not registered");
        Medicine memory m = medicines[_id];
        return (
            m.id,
            m.name,
            m.category,
            m.batchNo,
            m.quantity,
            m.expiryDate,
            m.description,
            m.imageURL,
            m.status,
            m.manufacturer
        );
    }
    
    function getMedicineTransfers(string memory _id) public view returns (
        address[] memory parties,
        uint256[] memory quantities,
        uint256[] memory prices,
        uint256[] memory timestamps,
        string[] memory roles
    ) {
        require(medicines[_id].isRegistered, "Medicine not registered");
        
        Transfer[] memory transfers = medicineTransfers[_id];
        uint256 length = transfers.length;
        
        address[] memory partiesArr = new address[](length * 2); // from and to
        uint256[] memory quantitiesArr = new uint256[](length);
        uint256[] memory pricesArr = new uint256[](length);
        uint256[] memory timestampsArr = new uint256[](length);
        string[] memory rolesArr = new string[](length);
        
        for (uint256 i = 0; i < length; i++) {
            partiesArr[i*2] = transfers[i].from;
            partiesArr[i*2+1] = transfers[i].to;
            quantitiesArr[i] = transfers[i].quantity;
            pricesArr[i] = transfers[i].price;
            timestampsArr[i] = transfers[i].timestamp;
            rolesArr[i] = transfers[i].role;
        }
        
        return (partiesArr, quantitiesArr, pricesArr, timestampsArr, rolesArr);
    }
    
    function getAllMedicineIds() public view returns (string[] memory) {
        return medicineIds;
    }
    
    function isAuthorizedManufacturer(address user) public view returns (bool) {
        return isManufacturer[user];
    }
    
    function isAuthorizedDistributor(address user) public view returns (bool) {
        return isDistributor[user];
    }
    
    function isAuthorizedRetailer(address user) public view returns (bool) {
        return isRetailer[user];
    }
    
    function transferOwnership(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "New admin cannot be zero address");
        emit OwnershipTransferred(admin, _newAdmin);
        admin = _newAdmin;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Types_wagon extends Model
{
    protected $table = 'types_wagons';
    protected $fillable = ['name'];

    public function malfunctions()
    {
        return $this->hasMany(Malfunction::class, 'types_wagon_id');
    }
}
